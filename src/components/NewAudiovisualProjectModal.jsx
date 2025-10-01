import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Film, FileText, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useModalBlur } from "@/hooks/useModalBlur";
import { supabase } from "@/integrations/supabase/client";

const NewAudiovisualProjectModal = ({ isOpen, setIsOpen, onProjectCreate }) => {
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [approvalLink, setApprovalLink] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const fileInputRef = useRef(null);
  const uploadAbortRef = useRef(null);
  const { toast } = useToast();

  // Use the layered blur system
  useModalBlur(isOpen, () => setIsOpen(false));

  useEffect(() => {
    if (isOpen) {
      // Reset form quando modal abre
      setTitle('');
      setComment('');
      setClientName('');
      setClientEmail('');
      setVideoFile(null);
      setApprovalLink('');
      setShowSuccess(false);
    }
  }, [isOpen]);

  const getEstimatedTime = (fileSize) => {
    const sizeMB = fileSize / (1024 * 1024);
    if (sizeMB < 50) return '10-30 segundos';
    if (sizeMB < 150) return '30-60 segundos';
    if (sizeMB < 300) return '1-2 minutos';
    return '2-3 minutos';
  };

  const getDynamicTimeout = (fileSize) => {
    const sizeMB = fileSize / (1024 * 1024);
    if (sizeMB < 50) return 30 * 1000; // 30 segundos
    if (sizeMB < 150) return 60 * 1000; // 1 minuto
    if (sizeMB < 300) return 120 * 1000; // 2 minutos
    return 180 * 1000; // 3 minutos
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadError('');
      
      // Validate file type
      const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
      const validExtensions = ['.mp4', '.mov'];
      const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      
      if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
        const errorMsg = "❌ Formato não suportado. Use MP4 ou MOV.";
        setUploadError(errorMsg);
        toast({
          title: "Formato não suportado",
          description: "Por favor, selecione um arquivo MP4 ou MOV",
          variant: "destructive",
        });
        return;
      }
      
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (file.size > maxSize) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const errorMsg = `❌ Arquivo muito grande (${fileSizeMB}MB). Máximo: 500MB`;
        setUploadError(errorMsg);
        toast({
          title: "Arquivo muito grande",
          description: `O arquivo tem ${fileSizeMB}MB. O limite é 500MB. Tente comprimir o vídeo.`,
          variant: "destructive",
        });
        return;
      }
      
      const estimated = getEstimatedTime(file.size);
      setEstimatedTime(estimated);
      setVideoFile(file);
      
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      toast({
        title: "🎥 Vídeo Anexado!",
        description: `${file.name} (${fileSizeMB}MB) - Tempo estimado: ${estimated}`,
        duration: 4000,
      });
    }
  };

  const handleSubmit = async (retryCount = 0) => {
    if (!title || !clientName || !videoFile) {
      toast({
        title: "Campos Obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setUploadError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const projectId = crypto.randomUUID();
      const fileName = `${projectId}/${Date.now()}.${videoFile.name.split('.').pop()}`;
      
      setUploadProgress(20);

      console.log('🚀 Iniciando upload do vídeo...');
      
      const dynamicTimeout = getDynamicTimeout(videoFile.size);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), dynamicTimeout)
      );
      
      const uploadPromise = supabase.storage
        .from('audiovisual-projects')
        .upload(fileName, videoFile, {
          contentType: videoFile.type,
          cacheControl: '3600',
          upsert: false
        });
      
      const { error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]);

      if (uploadError) {
        throw uploadError;
      }

      setUploadProgress(70);
      console.log('✅ Upload do vídeo concluído');

      const { data: { publicUrl } } = supabase.storage
        .from('audiovisual-projects')
        .getPublicUrl(fileName);

      setUploadProgress(80);

      const shareId = `av-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const projectData = {
        id: projectId,
        title: title.trim(),
        client: clientName.trim(),
        description: comment.trim() || null,
        type: 'Audiovisual',
        status: 'pending',
        priority: 'medium',
        video_url: publicUrl,
        share_id: shareId,
        user_id: user.id
      };

      await onProjectCreate(projectData);
      
      setUploadProgress(95);
      console.log('✅ Projeto criado com sucesso');

      const approvalLink = `${window.location.origin}/aprovacao-audiovisual/${shareId}`;
      setApprovalLink(approvalLink);
      setShowSuccess(true);
      setUploadProgress(100);

      toast({
        title: "✅ Projeto Criado!",
        description: "O vídeo está pronto para aprovação do cliente.",
        duration: 3000,
      });

    } catch (error) {
      console.error('❌ Erro ao criar projeto:', error);
      
      let errorTitle = "❌ Erro no Upload";
      let errorDescription = "";
      
      if (error.message === 'TIMEOUT') {
        errorTitle = "⏱️ Tempo Esgotado";
        errorDescription = `Upload demorou muito (${estimatedTime}). Tente com um arquivo menor ou verifique sua conexão.`;
        setUploadError(errorDescription);
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorTitle = "🌐 Problema de Conexão";
        errorDescription = "Verifique sua internet e tente novamente.";
        setUploadError(errorDescription);
        
        // Auto-retry uma vez para erros de conexão
        if (retryCount === 0) {
          toast({
            title: "🔄 Tentando novamente...",
            description: "Reconectando...",
            duration: 2000,
          });
          setTimeout(() => handleSubmit(1), 2000);
          return;
        }
      } else if (error.message?.includes('size') || error.message?.includes('large')) {
        errorTitle = "📦 Arquivo Muito Grande";
        errorDescription = "Tente comprimir o vídeo ou usar um arquivo menor que 500MB.";
        setUploadError(errorDescription);
      } else {
        errorDescription = error.message || "Erro ao enviar vídeo. Tente novamente.";
        setUploadError(errorDescription);
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="lovable-modal-content bg-background rounded-2xl shadow-2xl w-full max-w-4xl mx-4 my-8 flex flex-col" style={{ maxHeight: '90vh' }} role="dialog" aria-modal="true">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-background rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <Film className="h-6 w-6 text-orange-500" />
                <h2 className="text-2xl font-bold text-foreground">Novo Projeto Audiovisual</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="overflow-y-auto p-8 space-y-8 flex-1">
              {showSuccess ? (
                // Tela de Sucesso com Link
                <div className="flex flex-col items-center justify-center space-y-6 py-12">
                  <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                  </div>
                  
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold text-foreground">Projeto Criado com Sucesso!</h3>
                    <p className="text-muted-foreground">
                      Compartilhe o link abaixo com seu cliente para aprovação do vídeo
                    </p>
                  </div>

                  <div className="w-full max-w-2xl space-y-4">
                    <div className="p-4 bg-muted/50 rounded-xl border border-border">
                      <Label className="text-sm font-medium mb-2 block">Link de Aprovação</Label>
                      <div className="flex gap-2">
                        <Input
                          value={approvalLink}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          onClick={() => {
                            navigator.clipboard.writeText(approvalLink);
                            toast({
                              title: "✅ Link Copiado!",
                              description: "O link foi copiado para a área de transferência.",
                              duration: 3000,
                            });
                          }}
                          className="whitespace-nowrap"
                        >
                          Copiar Link
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
                      <p className="font-semibold text-foreground">📌 Próximos Passos:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Envie este link para o cliente via WhatsApp ou e-mail</li>
                        <li>O cliente poderá assistir e aprovar o vídeo</li>
                        <li>Você receberá notificações sobre o status da aprovação</li>
                      </ul>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setShowSuccess(false);
                      setIsOpen(false);
                    }}
                    size="lg"
                    className="mt-4"
                  >
                    Fechar
                  </Button>
                </div>
              ) : (
                // Formulário Normal
                <>
              <div className="p-6 bg-muted/50 rounded-xl border border-border space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="av-title">Nome do projeto</Label>
                  <Input id="av-title" placeholder="Ex: Vídeo Institucional 2025" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="av-comment">Descrição do projeto</Label>
                  <Textarea id="av-comment" placeholder="Adicione uma descrição, observações ou o roteiro do vídeo aqui..." value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client-name">Nome do cliente</Label>
                    <Input id="client-name" placeholder="Nome do Cliente" value={clientName} onChange={(e) => setClientName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-email">E-mail do cliente (opcional)</Label>
                    <Input type="email" id="client-email" placeholder="email@cliente.com" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground">Arquivo de Vídeo</h3>
                {uploadError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                    {uploadError}
                  </div>
                )}
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    uploadError 
                      ? 'border-destructive/50 bg-destructive/5' 
                      : 'border-muted-foreground/30 hover:border-orange-500 hover:bg-muted/50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".mp4,.mov,video/mp4,video/quicktime"
                    onChange={handleFileChange}
                  />
                  {videoFile ? (
                    <div className="flex flex-col items-center justify-center text-green-600">
                      <CheckCircle className="h-12 w-12 mb-3" />
                      <p className="font-semibold text-lg">Vídeo Carregado!</p>
                      <p className="text-sm text-muted-foreground">{videoFile.name}</p>
                      <Button variant="link" size="sm" className="mt-2 text-sm">Trocar arquivo</Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Upload className="h-12 w-12 mb-3 text-muted-foreground" />
                      <p className="font-semibold text-lg">Arraste ou clique para enviar</p>
                      <p className="text-sm">Formatos: MP4 ou MOV (máximo 500MB)</p>
                    </div>
                  )}
                </div>
              </div>
              </>
              )}
            </div>

            {!showSuccess && (
            <div className="flex justify-end p-6 border-t border-border sticky bottom-0 bg-background rounded-b-2xl z-10">
              <div className="flex gap-4">
                <Button variant="outline" size="lg" onClick={() => setIsOpen(false)} disabled={isUploading}>
                  Cancelar
                </Button>
                <Button className="btn-primary" onClick={handleSubmit} disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Criando... {uploadProgress}%
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5 mr-2" />
                      Criar Projeto
                    </>
                  )}
                </Button>
              </div>
            </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NewAudiovisualProjectModal;