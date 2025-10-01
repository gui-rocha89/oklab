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
  const fileInputRef = useRef(null);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
      const validExtensions = ['.mp4', '.mov'];
      const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      
      if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
        toast({
          title: "Formato não suportado",
          description: "Por favor, selecione um arquivo MP4 ou MOV",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 500 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O vídeo deve ter no máximo 500MB",
          variant: "destructive",
        });
        return;
      }
      
      setVideoFile(file);
      toast({
        title: "🎥 Vídeo Anexado!",
        description: `${file.name} foi selecionado com sucesso.`,
        duration: 3000,
      });
    }
  };

  const handleSubmit = async () => {
    const timestamp = () => `[${new Date().toISOString()}]`;
    console.log('🎬 [Audiovisual]', timestamp(), 'Iniciando criação de projeto...');
    
    // ========== ETAPA 1: VALIDAÇÃO DOS DADOS ==========
    console.log('📋 [Audiovisual]', timestamp(), 'ETAPA 1: Validando dados do formulário...');
    
    if (!title.trim()) {
      console.error('❌ [Audiovisual]', timestamp(), 'Validação falhou: Título vazio');
      toast({
        title: "❌ Erro de Validação",
        description: "O título do projeto é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    console.log('✅ [Audiovisual]', timestamp(), 'Título válido:', title.trim());
    
    if (!clientName.trim()) {
      console.error('❌ [Audiovisual]', timestamp(), 'Validação falhou: Nome do cliente vazio');
      toast({
        title: "❌ Erro de Validação",
        description: "O nome do cliente é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    console.log('✅ [Audiovisual]', timestamp(), 'Cliente válido:', clientName.trim());
    
    if (!videoFile) {
      console.error('❌ [Audiovisual]', timestamp(), 'Validação falhou: Nenhum vídeo selecionado');
      toast({
        title: "❌ Erro de Validação",
        description: "É necessário anexar um vídeo.",
        variant: "destructive",
      });
      return;
    }
    console.log('✅ [Audiovisual]', timestamp(), 'Vídeo válido:', {
      nome: videoFile.name,
      tamanho: `${(videoFile.size / 1024 / 1024).toFixed(2)} MB`,
      tipo: videoFile.type
    });
    
    console.log('✅ [Audiovisual]', timestamp(), 'ETAPA 1 CONCLUÍDA: Todos os dados validados');

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // ========== ETAPA 2: VERIFICAÇÃO DE AUTENTICAÇÃO ==========
      console.log('🔐 [Audiovisual]', timestamp(), 'ETAPA 2: Verificando autenticação...');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ [Audiovisual]', timestamp(), 'Erro de autenticação:', authError);
        throw new Error(`Erro de autenticação: ${authError.message}`);
      }
      
      if (!user || !user.id) {
        console.error('❌ [Audiovisual]', timestamp(), 'Usuário não autenticado ou ID ausente');
        throw new Error('Você precisa estar logado para criar projetos');
      }
      
      console.log('✅ [Audiovisual]', timestamp(), 'Usuário autenticado:', {
        id: user.id,
        email: user.email
      });
      console.log('✅ [Audiovisual]', timestamp(), 'ETAPA 2 CONCLUÍDA: Autenticação verificada');
      
      setUploadProgress(20);

      // ========== ETAPA 3: UPLOAD DO VÍDEO ==========
      console.log('📤 [Audiovisual]', timestamp(), 'ETAPA 3: Iniciando upload do vídeo...');
      
      const fileExt = videoFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      console.log('📂 [Audiovisual]', timestamp(), 'Caminho do arquivo:', fileName);
      console.log('📂 [Audiovisual]', timestamp(), 'Bucket:', 'audiovisual-projects');
      
      setUploadProgress(30);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audiovisual-projects')
        .upload(fileName, videoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ [Audiovisual]', timestamp(), 'ERRO NO UPLOAD:', {
          message: uploadError.message,
          statusCode: uploadError.statusCode,
          error: uploadError
        });
        throw new Error(`Falha no upload do vídeo: ${uploadError.message}`);
      }

      if (!uploadData || !uploadData.path) {
        console.error('❌ [Audiovisual]', timestamp(), 'Upload retornou dados inválidos:', uploadData);
        throw new Error('Upload do vídeo falhou: resposta inválida do servidor');
      }

      console.log('✅ [Audiovisual]', timestamp(), 'Upload concluído com sucesso:', {
        path: uploadData.path,
        id: uploadData.id,
        fullPath: uploadData.fullPath
      });
      console.log('✅ [Audiovisual]', timestamp(), 'ETAPA 3 CONCLUÍDA: Vídeo enviado');
      
      setUploadProgress(50);

      // ========== ETAPA 4: OBTENÇÃO DA URL PÚBLICA ==========
      console.log('🔗 [Audiovisual]', timestamp(), 'ETAPA 4: Obtendo URL pública do vídeo...');
      
      const { data: { publicUrl } } = supabase.storage
        .from('audiovisual-projects')
        .getPublicUrl(fileName);

      if (!publicUrl) {
        console.error('❌ [Audiovisual]', timestamp(), 'Falha ao obter URL pública');
        throw new Error('Não foi possível obter a URL do vídeo');
      }

      console.log('✅ [Audiovisual]', timestamp(), 'URL pública obtida:', publicUrl);
      console.log('✅ [Audiovisual]', timestamp(), 'ETAPA 4 CONCLUÍDA: URL pública gerada');
      
      setUploadProgress(70);

      // ========== ETAPA 5: GERAÇÃO DO SHARE_ID ==========
      console.log('🔑 [Audiovisual]', timestamp(), 'ETAPA 5: Gerando Share ID único...');
      
      const shareId = `av-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('✅ [Audiovisual]', timestamp(), 'Share ID gerado:', shareId);
      console.log('✅ [Audiovisual]', timestamp(), 'ETAPA 5 CONCLUÍDA: Share ID criado');
      
      setUploadProgress(80);

      // ========== ETAPA 6: PREPARAÇÃO DOS DADOS DO PROJETO ==========
      console.log('📦 [Audiovisual]', timestamp(), 'ETAPA 6: Preparando dados do projeto...');
      
      const projectData = {
        title: title.trim(),
        description: comment.trim() || null,
        client: clientName.trim(),
        type: 'Audiovisual',
        status: 'pending',
        priority: 'medium',
        user_id: user.id,
        share_id: shareId,
        video_url: publicUrl,
      };
      
      console.log('✅ [Audiovisual]', timestamp(), 'Dados preparados');
      
      setUploadProgress(90);

      // ========== ETAPA 7: CRIAÇÃO DO PROJETO NO BANCO ==========
      console.log('💾 [Audiovisual]', timestamp(), 'Criando projeto no banco...');
      
      await onProjectCreate(projectData);
      
      console.log('✅ [Audiovisual]', timestamp(), 'Projeto criado com sucesso');
      
      setUploadProgress(100);

      // ========== ETAPA 8: GERAÇÃO DO LINK DE APROVAÇÃO ==========
      console.log('🔗 [Audiovisual]', timestamp(), 'Gerando link de aprovação...');
      
      try {
        const baseUrl = window.location.origin;
        const generatedLink = `${baseUrl}/aprovacao-audiovisual/${shareId}`;
        console.log('✅ [Audiovisual]', timestamp(), 'Link gerado:', generatedLink);
        
        setApprovalLink(generatedLink);
        setShowSuccess(true);
      } catch (linkError) {
        console.error('❌ [Audiovisual]', timestamp(), 'Erro ao gerar link:', linkError);
        toast({
          title: "⚠️ Aviso",
          description: "Projeto criado, mas não foi possível gerar o link de aprovação.",
          variant: "destructive",
        });
      }

      toast({
        title: "✅ Projeto Criado com Sucesso!",
        description: `O projeto "${title}" foi criado. Link de aprovação gerado!`,
        duration: 5000,
      });
      
    } catch (error) {
      console.error('❌ [Audiovisual]', timestamp(), 'Erro ao criar projeto:', error.message);
      
      toast({
        title: "❌ Erro ao Criar Projeto",
        description: error.message || "Ocorreu um erro inesperado. Verifique o console para mais detalhes.",
        variant: "destructive",
        duration: 7000,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
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
                <div
                  className="relative border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center cursor-pointer hover:border-orange-500 hover:bg-muted/50 transition-all"
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