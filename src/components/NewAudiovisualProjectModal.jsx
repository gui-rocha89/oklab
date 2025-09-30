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
    }
  }, [isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      toast({
        title: "🎥 Vídeo Anexado!",
        description: `${file.name} foi selecionado com sucesso.`,
        duration: 3000,
      });
    } else {
      toast({
        title: "Formato Inválido",
        description: "Por favor, selecione um arquivo de vídeo.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    console.log('🎬 [Audiovisual] Iniciando criação de projeto...');
    
    // Validações
    if (!title.trim()) {
      console.error('❌ [Audiovisual] Título vazio');
      toast({
        title: "Erro de Validação",
        description: "O título do projeto é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    
    if (!clientName.trim()) {
      console.error('❌ [Audiovisual] Nome do cliente vazio');
      toast({
        title: "Erro de Validação",
        description: "O nome do cliente é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    
    if (!videoFile) {
      console.error('❌ [Audiovisual] Nenhum vídeo selecionado');
      toast({
        title: "Erro de Validação",
        description: "É necessário anexar um vídeo.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log('📤 [Audiovisual] Iniciando upload do vídeo...', {
        fileName: videoFile.name,
        fileSize: videoFile.size,
        fileType: videoFile.type
      });

      // Upload do vídeo para o Supabase Storage
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const fileExt = videoFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      console.log('📂 [Audiovisual] Fazendo upload para:', fileName);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audiovisual-projects')
        .upload(fileName, videoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ [Audiovisual] Erro no upload:', uploadError);
        throw uploadError;
      }

      console.log('✅ [Audiovisual] Upload concluído:', uploadData);
      setUploadProgress(50);

      // Obter URL pública do vídeo
      const { data: { publicUrl } } = supabase.storage
        .from('audiovisual-projects')
        .getPublicUrl(fileName);

      console.log('🔗 [Audiovisual] URL pública:', publicUrl);
      setUploadProgress(75);

      // Gerar share_id único
      const shareId = `av-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log('🔑 [Audiovisual] Share ID gerado:', shareId);

      // Criar objeto do projeto SOMENTE com campos que existem na tabela
      const newProject = {
        title: title.trim(),
        description: comment.trim() || null,
        client: clientName.trim(),
        type: 'Audiovisual',
        status: 'pending',
        priority: 'medium',
        user_id: user.id,
        share_id: shareId,
        video_url: publicUrl, // Campo correto que existe na tabela
      };

      console.log('📝 [Audiovisual] Dados do projeto (SOMENTE campos válidos):', newProject);
      console.log('🔍 [Audiovisual] Campos enviados:', Object.keys(newProject));
      setUploadProgress(90);

      // Chamar a função de criação do projeto
      await onProjectCreate(newProject);
      
      setUploadProgress(100);
      console.log('✅ [Audiovisual] Projeto criado com sucesso!');

      toast({
        title: "✅ Projeto Criado!",
        description: `O projeto "${title}" foi criado com sucesso.`,
        duration: 3000,
      });

      setIsOpen(false);
    } catch (error) {
      console.error('❌ [Audiovisual] Erro ao criar projeto:', error);
      toast({
        title: "Erro ao Criar Projeto",
        description: error.message || "Ocorreu um erro ao criar o projeto. Tente novamente.",
        variant: "destructive",
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
                    <Label htmlFor="client-email">E-mail do cliente</Label>
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
                    accept="video/*"
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
                      <p className="text-sm">Formatos de vídeo suportados (MP4, MOV, etc.)</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NewAudiovisualProjectModal;