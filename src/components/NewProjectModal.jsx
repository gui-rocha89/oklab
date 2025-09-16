import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Calendar as CalendarIcon, Upload, Paperclip, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useModalBlur } from "@/hooks/useModalBlur";

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
  const { toast } = useToast();

  // Use the layered blur system
  useModalBlur(isOpen, () => setIsOpen(false));

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

  const handleSubmit = () => {
    if (!projectName.trim()) {
      toast({
        title: "Erro de Validação",
        description: "O nome do projeto é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    const newProject = {
      title: projectName,
      description: projectDescription,
      clientName: clientName,
      clientEmail: clientEmail,
      creatives: creatives,
      type: 'Design',
    };
    onProjectCreate(newProject);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="lovable-modal-content fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1001] bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 flex flex-col" 
          style={{ maxHeight: '90vh' }} 
          role="dialog" 
          aria-modal="true"
        >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <FileSignature className="h-6 w-6 text-orange-500" />
                <h2 className="text-2xl font-bold text-gray-900">Criar Novo Projeto</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="overflow-y-auto p-8 space-y-8 flex-1">
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
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

              <h3 className="text-xl font-bold text-gray-800">Criativos</h3>
              <AnimatePresence>
                {creatives.map((creative, creativeIndex) => (
                  <motion.div
                    key={creative.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50, height: 0, padding: 0, margin: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-6 bg-white rounded-xl border border-gray-200 space-y-6"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-lg text-gray-700">Criativo #{creativeIndex + 1}</h4>
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
                            <Calendar mode="single" selected={creative.publishDate} onSelect={(date) => handleCreativeChange(creative.id, 'publishDate', date)} initialFocus />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`c-caption-${creative.id}`}>Legenda</Label>
                      <Textarea id={`c-caption-${creative.id}`} placeholder="Adicione uma legenda para o criativo" value={creative.caption} onChange={(e) => handleCreativeChange(creative.id, 'caption', e.target.value)} />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-dashed">
                      <h5 className="font-semibold text-gray-700">Anexos</h5>
                      <div className="space-y-4">
                        {creative.attachments.map((attachment) => (
                           <div key={attachment.id} className="p-4 bg-slate-50 rounded-lg border flex flex-col md:flex-row items-center gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow w-full">
                              <Input placeholder="Nome do anexo" value={attachment.name} onChange={(e) => handleAttachmentChange(creative.id, attachment.id, 'name', e.target.value)} />
                              <Select value={attachment.type} onValueChange={(value) => handleAttachmentChange(creative.id, attachment.id, 'type', value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Tipo de anexo" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="auto-hosted">Auto-hospedado</SelectItem>
                                  <SelectItem value="link-externo">Link Externo</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                              <Button asChild variant="outline" className="flex-grow md:flex-grow-0">
                                <Label className="cursor-pointer">
                                  <Upload className="h-4 w-4 mr-2" /> {attachment.file ? 'Trocar' : 'Enviar'}
                                  <input type="file" className="hidden" onChange={(e) => handleFileUpload(creative.id, attachment.id, e.target.files[0])} />
                                </Label>
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => removeAttachment(creative.id, attachment.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            {attachment.file && <div className="text-sm text-gray-500 flex items-center gap-1 w-full md:w-auto"><Paperclip className="h-3 w-3" /><span>{attachment.file.name}</span></div>}
                          </div>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => addAttachment(creative.id)}>
                        <Plus className="h-4 w-4 mr-2" /> Adicionar Anexo
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <Button variant="outline" onClick={addCreative} className="w-full border-dashed">
                <Plus className="h-4 w-4 mr-2" /> Adicionar Criativo
              </Button>
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200 sticky bottom-0 bg-white rounded-b-2xl z-10">
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button className="btn-primary" onClick={handleSubmit}>Criar Projeto</Button>
              </div>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NewProjectModal;