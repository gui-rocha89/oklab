import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Calendar as CalendarIcon, Upload, Paperclip, FileSignature, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

const initialCreativeState = {
  id: 1,
  name: 'Criativo 1',
  type: '',
  publishDate: null,
  caption: '',
  attachments: [{ id: 1, name: 'Anexo 1', type: 'auto-hosted', file: null }],
};

const NewProjectModal = ({ isOpen, setIsOpen, onProjectCreate }) => {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [creatives, setCreatives] = useState([initialCreativeState]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [projectLink, setProjectLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Reset form quando modal abre
      setProjectName('');
      setProjectDescription('');
      setClientName('');
      setClientEmail('');
      setCreatives([
        {
          id: 1,
          name: 'Criativo 1',
          type: '',
          publishDate: null,
          caption: '',
          attachments: [{ id: 1, name: 'Anexo 1', type: 'auto-hosted', file: null }],
        },
      ]);
      setShowSuccess(false);
      setProjectLink('');
      setLinkCopied(false);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleCreativeChange = (creativeId, field, value) => {
    setCreatives(prev =>
      prev.map(c => (c.id === creativeId ? { ...c, [field]: value } : c))
    );
  };

  const handleAttachmentChange = (creativeId, attachmentId, field, value) => {
    setCreatives(prev =>
      prev.map(c =>
        c.id === creativeId
          ? {
              ...c,
              attachments: c.attachments.map(a =>
                a.id === attachmentId ? { ...a, [field]: value } : a
              ),
            }
          : c
      )
    );
  };

  const addCreative = () => {
    const newId = creatives.length > 0 ? Math.max(...creatives.map(c => c.id)) + 1 : 1;
    setCreatives([
      ...creatives,
      {
        id: newId,
        name: `Criativo ${newId}`,
        type: '',
        publishDate: null,
        caption: '',
        attachments: [{ id: 1, name: 'Anexo 1', type: 'auto-hosted', file: null }],
      },
    ]);
  };

  const removeCreative = (creativeId) => {
    setCreatives(prev => prev.filter(c => c.id !== creativeId));
  };

  const addAttachment = (creativeId) => {
    setCreatives(prev =>
      prev.map(c => {
        if (c.id === creativeId) {
          const newId = c.attachments.length > 0 ? Math.max(...c.attachments.map(a => a.id)) + 1 : 1;
          return {
            ...c,
            attachments: [
              ...c.attachments,
              { id: newId, name: `Anexo ${newId}`, type: 'auto-hosted', file: null },
            ],
          };
        }
        return c;
      })
    );
  };

  const removeAttachment = (creativeId, attachmentId) => {
    setCreatives(prev =>
      prev.map(c =>
        c.id === creativeId
          ? { ...c, attachments: c.attachments.filter(a => a.id !== attachmentId) }
          : c
      )
    );
  };
  
  const handleFileUpload = (creativeId, attachmentId, file) => {
    if (file) {
      handleAttachmentChange(creativeId, attachmentId, 'file', file);
      handleAttachmentChange(creativeId, attachmentId, 'name', file.name);
      toast({
        title: "Arquivo Anexado!",
        description: `${file.name} foi selecionado.`,
        duration: 3000,
      });
    }
  };

  const generateShareId = () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };

  const handleSubmit = async () => {
    if (!projectName.trim()) {
      toast({
        title: "Erro de Validação",
        description: "O nome do projeto é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro de Autenticação",
          description: "Você precisa estar logado para criar projetos.",
          variant: "destructive",
        });
        return;
      }

      const shareId = generateShareId();
      
      // Create project in Supabase
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          title: projectName,
          description: projectDescription,
          client: clientName,
          type: 'Design',
          user_id: user.id,
          share_id: shareId,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Create keyframes for each creative
      const keyframesData = creatives.map(creative => ({
        project_id: project.id,
        title: creative.name || `Creative ${creative.id}`,
        attachments: creative.attachments.map(attachment => ({
          id: attachment.id,
          type: attachment.type,
          name: attachment.name,
          file: attachment.file ? {
            name: attachment.file.name,
            size: attachment.file.size,
            type: attachment.file.type
          } : null,
          publishDate: creative.publishDate
        }))
      }));

      const { error: keyframesError } = await supabase
        .from('project_keyframes')
        .insert(keyframesData);

      if (keyframesError) throw keyframesError;

      // Generate approval link
      const approvalLink = `${window.location.origin}/projeto/${shareId}`;
      setProjectLink(approvalLink);
      
      // Show success state
      setShowSuccess(true);

      // Call parent callback
      onProjectCreate({
        ...project,
        creatives: creatives,
        approvalLink
      });

      toast({
        title: "✅ Projeto Criado!",
        description: "Link de aprovação gerado com sucesso.",
      });

    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Erro ao Criar Projeto",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(projectLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      toast({
        title: "Link Copiado!",
        description: "Cole e envie para o cliente aprovar.",
      });
    } catch (error) {
      toast({
        title: "Erro ao Copiar",
        description: "Tente copiar manualmente.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setShowSuccess(false);
    setProjectLink('');
    setLinkCopied(false);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0" aria-labelledby="modal-title" aria-describedby="modal-desc">
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-background z-10">
            <div className="flex items-center gap-3">
              <FileSignature className="h-6 w-6 text-orange-500" />
              <DialogTitle id="modal-title" className="text-2xl font-bold text-foreground">
                {showSuccess ? "Projeto Criado!" : "Aprovação de Posts"}
              </DialogTitle>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </DialogClose>
          </div>

          {/* Body com scroll interno */}
          <div id="modal-desc" className="flex-1 overflow-y-auto p-8 space-y-8">
            {showSuccess ? (
              <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">Projeto criado com sucesso!</h3>
                  <p className="text-muted-foreground">
                    Envie o link abaixo para o cliente aprovar o projeto:
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-xl border border-border space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-background rounded-lg border">
                    <code className="flex-1 text-sm text-foreground font-mono break-all">
                      {projectLink}
                    </code>
                    <Button
                      onClick={handleCopyLink}
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                    >
                      {linkCopied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ExternalLink className="w-4 h-4" />
                    <span>Este link permite que o cliente visualize, comente e aprove o projeto</span>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    💡 <strong>Dica:</strong> Após a aprovação/feedback, o cliente poderá avaliar nossa plataforma com estrelas e comentários.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-6 bg-muted/50 rounded-xl border border-border space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-name">Nome do projeto</Label>
                    <Input id="project-name" placeholder="Ex: Campanha de Lançamento" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-desc">Descrição do projeto</Label>
                    <Textarea id="project-desc" placeholder="Descreva os objetivos e detalhes do projeto" value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} />
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

                <h3 className="text-xl font-bold text-foreground">Criativos</h3>
                <AnimatePresence>
                  {creatives.map((creative, creativeIndex) => (
                    <motion.div
                      key={creative.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50, height: 0, padding: 0, margin: 0 }}
                      transition={{ duration: 0.3 }}
                      className="p-6 bg-card rounded-xl border border-border space-y-6"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-lg text-card-foreground">Criativo #{creativeIndex + 1}</h4>
                        <Button variant="destructive" size="sm" onClick={() => removeCreative(creative.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2 md:col-span-1">
                          <Label htmlFor={`c-name-${creative.id}`}>Nome</Label>
                          <Input id={`c-name-${creative.id}`} value={creative.name} onChange={(e) => handleCreativeChange(creative.id, 'name', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`c-type-${creative.id}`}>Tipo</Label>
                          <Select onValueChange={(value) => handleCreativeChange(creative.id, 'type', value)}>
                            <SelectTrigger id={`c-type-${creative.id}`}>
                              <SelectValue placeholder="Selecione um tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="post-imagem">Post (Imagem)</SelectItem>
                              <SelectItem value="story">Story</SelectItem>
                              <SelectItem value="carrossel">Carrossel</SelectItem>
                              <SelectItem value="video">Vídeo</SelectItem>
                              <SelectItem value="reel">Reel</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`c-date-${creative.id}`}>Data de publicação</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn("w-full justify-start text-left font-normal", !creative.publishDate && "text-muted-foreground")}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {creative.publishDate ? creative.publishDate.toLocaleDateString('pt-BR') : <span>dd/mm/aaaa</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar mode="single" selected={creative.publishDate} onSelect={(date) => handleCreativeChange(creative.id, 'publishDate', date)} initialFocus className="pointer-events-auto" />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`c-caption-${creative.id}`}>Legenda</Label>
                        <Textarea id={`c-caption-${creative.id}`} placeholder="Adicione uma legenda para o criativo" value={creative.caption} onChange={(e) => handleCreativeChange(creative.id, 'caption', e.target.value)} />
                      </div>

                      <div className="space-y-4 pt-4 border-t border-dashed">
                        <h5 className="font-semibold text-card-foreground">Anexos</h5>
                        <div className="space-y-4">
                          {creative.attachments.map((attachment) => (
                            <div key={attachment.id} className="p-4 bg-background rounded-lg border border-border space-y-4">
                              <div className="flex justify-between items-center">
                                <Label className="font-medium">{attachment.name}</Label>
                                <Button variant="ghost" size="sm" onClick={() => removeAttachment(creative.id, attachment.id)} disabled={creative.attachments.length === 1}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`att-type-${creative.id}-${attachment.id}`}>Tipo do anexo</Label>
                                <Select onValueChange={(value) => handleAttachmentChange(creative.id, attachment.id, 'type', value)} value={attachment.type}>
                                  <SelectTrigger id={`att-type-${creative.id}-${attachment.id}`}>
                                    <SelectValue placeholder="Selecione o tipo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="auto-hosted">Auto-Hosted (Upload)</SelectItem>
                                    <SelectItem value="drive-link">Drive Link</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              {attachment.type === 'auto-hosted' ? (
                                <div className="space-y-2">
                                  <Label htmlFor={`att-file-${creative.id}-${attachment.id}`}>Carregar arquivo</Label>
                                  <div className="flex items-center gap-2">
                                    <Button asChild variant="outline" size="sm">
                                      <label className="cursor-pointer">
                                        <Upload className="h-4 w-4 mr-2" />
                                        {attachment.file ? attachment.file.name : 'Escolher arquivo'}
                                        <input type="file" className="hidden" onChange={(e) => handleFileUpload(creative.id, attachment.id, e.target.files[0])} />
                                      </label>
                                    </Button>
                                    {!attachment.file && <span className="text-sm text-muted-foreground">Nenhum arquivo escolhido</span>}
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <Label htmlFor={`att-link-${creative.id}-${attachment.id}`}>Link do Drive</Label>
                                  <Input
                                    id={`att-link-${creative.id}-${attachment.id}`}
                                    placeholder="https://drive.google.com/..."
                                    value={attachment.driveLink || ''}
                                    onChange={(e) => handleAttachmentChange(creative.id, attachment.id, 'driveLink', e.target.value)}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => addAttachment(creative.id)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Anexo
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <Button variant="outline" onClick={addCreative}>
                  <Plus className="h-5 w-5 mr-2" />
                  Adicionar Criativo
                </Button>
              </>
            )}
          </div>

          {/* Footer sticky */}
          {!showSuccess && (
            <div className="sticky bottom-0 border-t border-border bg-background p-6 flex gap-2 justify-end">
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? "Criando..." : "Criar Projeto"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewProjectModal;
