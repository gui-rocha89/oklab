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
      
      console.log('✅ [Audiovisual]', timestamp(), 'Dados preparados:', {
        title: projectData.title,
        client: projectData.client,
        type: projectData.type,
        status: projectData.status,
        priority: projectData.priority,
        user_id: projectData.user_id,
        share_id: projectData.share_id,
        video_url_length: projectData.video_url?.length,
        hasDescription: !!projectData.description
      });
      console.log('✅ [Audiovisual]', timestamp(), 'ETAPA 6 CONCLUÍDA: Dados validados');
      
      setUploadProgress(90);

      // ========== ETAPA 7: CRIAÇÃO DO PROJETO NO BANCO ==========
      console.log('💾 [Audiovisual]', timestamp(), 'ETAPA 7: Criando projeto no banco de dados...');
      console.log('💾 [Audiovisual]', timestamp(), 'Chamando onProjectCreate...');
      
      await onProjectCreate(projectData);
      
      console.log('✅ [Audiovisual]', timestamp(), 'ETAPA 7 CONCLUÍDA: Projeto criado no banco');
      
      setUploadProgress(100);

      // ========== SUCESSO TOTAL ==========
      console.log('🎉 [Audiovisual]', timestamp(), '====================================');
      console.log('🎉 [Audiovisual]', timestamp(), 'TODAS AS ETAPAS CONCLUÍDAS COM SUCESSO!');
      console.log('🎉 [Audiovisual]', timestamp(), '====================================');
      console.log('📊 [Audiovisual]', timestamp(), 'Resumo do projeto criado:', {
        título: projectData.title,
        cliente: projectData.client,
        shareId: projectData.share_id,
        videoUrl: publicUrl
      });

      toast({
        title: "✅ Projeto Criado com Sucesso!",
        description: `O projeto "${title}" foi criado e está pronto para aprovação.`,
        duration: 5000,
      });

      setIsOpen(false);
      
    } catch (error) {
      console.error('💥 [Audiovisual]', timestamp(), '====================================');
      console.error('💥 [Audiovisual]', timestamp(), 'ERRO DURANTE A CRIAÇÃO DO PROJETO');
      console.error('💥 [Audiovisual]', timestamp(), '====================================');
      console.error('💥 [Audiovisual]', timestamp(), 'Tipo do erro:', error.constructor.name);
      console.error('💥 [Audiovisual]', timestamp(), 'Mensagem:', error.message);
      console.error('💥 [Audiovisual]', timestamp(), 'Stack:', error.stack);
      console.error('💥 [Audiovisual]', timestamp(), 'Erro completo:', error);
      
      toast({
        title: "❌ Erro ao Criar Projeto",
        description: error.message || "Ocorreu um erro inesperado. Verifique o console para mais detalhes.",
        variant: "destructive",
        duration: 7000,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      console.log('🏁 [Audiovisual]', timestamp(), 'Processo finalizado');
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
                <div className="space-y-2">
                  <Label htmlFor="client-name">Nome do cliente</Label>
                  <Input id="client-name" placeholder="Nome do Cliente" value={clientName} onChange={(e) => setClientName(e.target.value)} />
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