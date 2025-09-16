import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Calendar as CalendarIcon, Upload, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useModalBlur } from "@/hooks/useModalBlur";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const initialContentState = {
  id: 1,
  name: 'Conteúdo 1',
  postDate: null,
  format: '',
  description: '',
  caption: '',
  file: null,
  driveLink: '',
  isOpen: true
};

const NewBriefingModal = ({ isOpen, setIsOpen, onBriefingCreate }) => {
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [month, setMonth] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [approvalDeadline, setApprovalDeadline] = useState('');
  const [contents, setContents] = useState([initialContentState]);
  const { toast } = useToast();

  // Use the layered blur system
  useModalBlur(isOpen, () => setIsOpen(false));

  useEffect(() => {
    if (isOpen) {
      // Reset form quando modal abre
      setClientName('');
      setProjectName('');
      setMonth('');
      setStartDate(null);
      setEndDate(null);
      setApprovalDeadline('');
      setContents([{
        id: 1,
        name: 'Conteúdo 1',
        postDate: null,
        format: '',
        description: '',
        caption: '',
        file: null,
        driveLink: '',
        isOpen: true
      }]);
    }
  }, [isOpen]);

  const handleContentChange = (contentId, field, value) => {
    setContents(prev =>
      prev.map(c => (c.id === contentId ? { ...c, [field]: value } : c))
    );
  };

  const addContent = () => {
    const newId = contents.length > 0 ? Math.max(...contents.map(c => c.id)) + 1 : 1;
    setContents([
      ...contents,
      {
        id: newId,
        name: `Conteúdo ${newId}`,
        postDate: null,
        format: '',
        description: '',
        caption: '',
        file: null,
        driveLink: '',
        isOpen: true
      },
    ]);
  };

  const removeContent = (contentId) => {
    if (contents.length > 1) {
      setContents(prev => prev.filter(c => c.id !== contentId));
    }
  };

  const handleFileUpload = (contentId, file) => {
    if (file) {
      handleContentChange(contentId, 'file', file);
      toast({
        title: "Arquivo Anexado!",
        description: `${file.name} foi selecionado.`,
        duration: 3000,
      });
    }
  };

  const toggleContentExpansion = (contentId) => {
    setContents(prev =>
      prev.map(c => (c.id === contentId ? { ...c, isOpen: !c.isOpen } : c))
    );
  };

  const handleSubmit = () => {
    if (!clientName.trim()) {
      toast({
        title: "Erro de Validação",
        description: "O nome do cliente é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    if (!projectName.trim()) {
      toast({
        title: "Erro de Validação",
        description: "O nome do projeto é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    const newBriefing = {
      clientName,
      projectName,
      month,
      startDate,
      endDate,
      approvalDeadline,
      contents,
      type: 'Briefing',
    };
    onBriefingCreate(newBriefing);
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="lovable-modal-content bg-background rounded-2xl shadow-2xl w-full max-w-4xl mx-4 my-8 flex flex-col" style={{ maxHeight: '90vh' }} role="dialog" aria-modal="true">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-background rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-orange-500" />
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Criar Novo Briefing</h2>
                  <p className="text-sm text-muted-foreground">Configure o briefing para aprovação do cliente</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="overflow-y-auto p-8 space-y-8 flex-1">
              {/* Informações do Projeto */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-500" />
                  Informações do Projeto
                </h3>
                <div className="p-6 bg-muted/50 rounded-xl border border-border space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="client-name">Nome do Cliente *</Label>
                      <Input 
                        id="client-name" 
                        placeholder="Exemplo: PIPPI PNEUS" 
                        value={clientName} 
                        onChange={(e) => setClientName(e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project-name">Nome do Projeto *</Label>
                      <Input 
                        id="project-name" 
                        placeholder="Ex: Campanha Outubro" 
                        value={projectName} 
                        onChange={(e) => setProjectName(e.target.value)} 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="month">Mês</Label>
                      <Input 
                        id="month" 
                        placeholder="OUTUBRO" 
                        value={month} 
                        onChange={(e) => setMonth(e.target.value)} 
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-date">Início do período</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {startDate ? startDate.toLocaleDateString('pt-BR') : <span>Selecionar data</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-date">Fim do período</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {endDate ? endDate.toLocaleDateString('pt-BR') : <span>Selecionar data</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="approval-deadline">Prazo de Aprovação</Label>
                    <Select onValueChange={setApprovalDeadline} value={approvalDeadline}>
                      <SelectTrigger id="approval-deadline">
                        <SelectValue placeholder="Selecione o prazo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-dia">1 dia</SelectItem>
                        <SelectItem value="2-dias">2 dias</SelectItem>
                        <SelectItem value="3-dias">3 dias</SelectItem>
                        <SelectItem value="1-semana">1 semana</SelectItem>
                        <SelectItem value="2-semanas">2 semanas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Conteúdo do Briefing */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Plus className="h-5 w-5 text-orange-500" />
                  Conteúdo do Briefing
                </h3>
                
                <AnimatePresence>
                  {contents.map((content, contentIndex) => (
                    <motion.div
                      key={content.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50, height: 0, padding: 0, margin: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border border-border rounded-xl overflow-hidden"
                    >
                      <Collapsible open={content.isOpen} onOpenChange={() => toggleContentExpansion(content.id)}>
                        <CollapsibleTrigger asChild>
                          <div className="flex justify-between items-center p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                            <h4 className="font-semibold text-card-foreground">{content.name}</h4>
                            <div className="flex items-center gap-2">
                              {contents.length > 1 && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeContent(content.id);
                                  }}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                              {content.isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <div className="p-6 space-y-6 bg-card">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`post-date-${content.id}`}>Data de postagem</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant={"outline"}
                                      className={cn("w-full justify-start text-left font-normal", !content.postDate && "text-muted-foreground")}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {content.postDate ? content.postDate.toLocaleDateString('pt-BR') : <span>Selecionar data</span>}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <Calendar 
                                      mode="single" 
                                      selected={content.postDate} 
                                      onSelect={(date) => handleContentChange(content.id, 'postDate', date)} 
                                      initialFocus 
                                      className="pointer-events-auto" 
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`format-${content.id}`}>Formato</Label>
                                <Select onValueChange={(value) => handleContentChange(content.id, 'format', value)} value={content.format}>
                                  <SelectTrigger id={`format-${content.id}`}>
                                    <SelectValue placeholder="Selecione o formato" />
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
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`description-${content.id}`}>Descrição do Conteúdo</Label>
                              <Textarea 
                                id={`description-${content.id}`}
                                placeholder="Descreva o conteúdo que será postado..." 
                                value={content.description} 
                                onChange={(e) => handleContentChange(content.id, 'description', e.target.value)} 
                                rows={3}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`caption-${content.id}`}>Legenda</Label>
                              <Textarea 
                                id={`caption-${content.id}`}
                                placeholder="Texto da legenda/caption..." 
                                value={content.caption} 
                                onChange={(e) => handleContentChange(content.id, 'caption', e.target.value)} 
                                rows={3}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`file-${content.id}`}>Anexar Arquivo</Label>
                              <div className="flex items-center gap-4">
                                <Button asChild variant="outline" className="flex-grow">
                                  <Label className="cursor-pointer">
                                    <Upload className="h-4 w-4 mr-2" />
                                    {content.file ? content.file.name : 'Escolher arquivo'}
                                    <input 
                                      type="file" 
                                      className="hidden" 
                                      onChange={(e) => handleFileUpload(content.id, e.target.files[0])} 
                                    />
                                  </Label>
                                </Button>
                                {!content.file && <span className="text-sm text-muted-foreground">Nenhum arquivo escolhido</span>}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`drive-link-${content.id}`}>Link do Google Drive (opcional)</Label>
                              <Input 
                                id={`drive-link-${content.id}`}
                                placeholder="https://drive.google.com/..." 
                                value={content.driveLink} 
                                onChange={(e) => handleContentChange(content.id, 'driveLink', e.target.value)} 
                              />
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <Button variant="outline" onClick={addContent} className="w-full border-dashed">
                  <Plus className="h-4 w-4 mr-2" /> Adicionar conteúdo
                </Button>
              </div>
            </div>

            <div className="flex justify-end p-6 border-t border-border sticky bottom-0 bg-background rounded-b-2xl z-10">
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={handleSubmit}>
                  <FileText className="w-5 h-5 mr-2" />
                  Criar Briefing
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NewBriefingModal;