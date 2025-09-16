import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit3, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Upload,
  FileText,
  Image as ImageIcon,
  Film,
  Link,
  Calendar,
  User,
  Tag,
  AlertCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const ProjectEditModal = ({ isOpen, onClose, project, onSave }) => {
  const [editedProject, setEditedProject] = useState(null);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    if (project) {
      setEditedProject({
        ...project,
        creatives: project.creatives || [
          {
            id: 1,
            name: 'Criativo Principal',
            caption: 'Descrição do criativo',
            attachments: []
          }
        ]
      });
      setIsDirty(false);
      setErrors({});
    }
  }, [project]);

  const validateProject = () => {
    const newErrors = {};
    
    if (!editedProject?.title?.trim()) {
      newErrors.title = 'Título é obrigatório';
    }
    
    if (!editedProject?.description?.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }
    
    if (!editedProject?.type) {
      newErrors.type = 'Tipo de projeto é obrigatório';
    }
    
    if (!editedProject?.priority) {
      newErrors.priority = 'Prioridade é obrigatória';
    }
    
    // Validate creatives
    if (editedProject?.creatives?.length === 0) {
      newErrors.creatives = 'Pelo menos um criativo é necessário';
    }
    
    editedProject?.creatives?.forEach((creative, index) => {
      if (!creative.name?.trim()) {
        newErrors[`creative_${index}_name`] = 'Nome do criativo é obrigatório';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateProject()) {
      toast({
        title: "❌ Erro na validação",
        description: "Corrija os campos em vermelho antes de salvar",
        variant: "destructive",
      });
      return;
    }

    onSave(editedProject);
    setIsDirty(false);
    
    toast({
      title: "✅ Projeto atualizado!",
      description: "Suas alterações foram salvas com sucesso",
      duration: 3000,
    });
  };

  const handleFieldChange = (field, value) => {
    setEditedProject(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleCreativeChange = (index, field, value) => {
    setEditedProject(prev => ({
      ...prev,
      creatives: prev.creatives.map((creative, i) => 
        i === index ? { ...creative, [field]: value } : creative
      )
    }));
    setIsDirty(true);
    
    // Clear error for this field
    const errorKey = `creative_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: undefined
      }));
    }
  };

  const addCreative = () => {
    setEditedProject(prev => ({
      ...prev,
      creatives: [
        ...prev.creatives,
        {
          id: Date.now(),
          name: `Criativo ${prev.creatives.length + 1}`,
          caption: '',
          attachments: []
        }
      ]
    }));
    setIsDirty(true);
  };

  const removeCreative = (index) => {
    if (editedProject.creatives.length <= 1) {
      toast({
        title: "⚠️ Ação não permitida",
        description: "Pelo menos um criativo deve permanecer no projeto",
        variant: "destructive",
      });
      return;
    }
    
    setEditedProject(prev => ({
      ...prev,
      creatives: prev.creatives.filter((_, i) => i !== index)
    }));
    setIsDirty(true);
  };

  const handleFileUpload = (creativeIndex, files) => {
    const newAttachments = Array.from(files).map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
      size: file.size
    }));
    
    setEditedProject(prev => ({
      ...prev,
      creatives: prev.creatives.map((creative, i) => 
        i === creativeIndex 
          ? { ...creative, attachments: [...creative.attachments, ...newAttachments] }
          : creative
      )
    }));
    setIsDirty(true);
    
    toast({
      title: "📎 Arquivos adicionados",
      description: `${newAttachments.length} arquivo(s) anexado(s) ao criativo`,
    });
  };

  const removeAttachment = (creativeIndex, attachmentId) => {
    setEditedProject(prev => ({
      ...prev,
      creatives: prev.creatives.map((creative, i) => 
        i === creativeIndex 
          ? { 
              ...creative, 
              attachments: creative.attachments.filter(a => a.id !== attachmentId)
            }
          : creative
      )
    }));
    setIsDirty(true);
  };

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return ImageIcon;
    if (type?.startsWith('video/')) return Film;
    return FileText;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const tabs = [
    { id: 'info', label: 'Informações', icon: FileText },
    { id: 'creatives', label: 'Criativos', icon: ImageIcon },
    { id: 'settings', label: 'Configurações', icon: Tag }
  ];

  if (!editedProject) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Edit3 className="w-5 h-5 text-primary" />
              <span>Editar Projeto</span>
              {isDirty && (
                <Badge variant="outline" className="text-amber-600 border-amber-600">
                  Não salvo
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleSave}
                disabled={!isDirty}
                className="flex items-center space-x-1"
              >
                <Save className="w-4 h-4" />
                <span>Salvar</span>
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {tabs.map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Informações Básicas */}
            {activeTab === 'info' && (
              <motion.div
                key="info"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6 p-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Título do Projeto *</Label>
                      <Input
                        id="title"
                        value={editedProject.title}
                        onChange={(e) => handleFieldChange('title', e.target.value)}
                        className={errors.title ? 'border-red-500' : ''}
                        placeholder="Digite o título do projeto"
                      />
                      {errors.title && (
                        <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="type">Tipo de Projeto *</Label>
                      <Select 
                        value={editedProject.type} 
                        onValueChange={(value) => handleFieldChange('type', value)}
                      >
                        <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="social-media">Social Media</SelectItem>
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="print">Impresso</SelectItem>
                          <SelectItem value="video">Vídeo</SelectItem>
                          <SelectItem value="branding">Branding</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.type && (
                        <p className="text-red-500 text-sm mt-1">{errors.type}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="priority">Prioridade *</Label>
                      <Select 
                        value={editedProject.priority} 
                        onValueChange={(value) => handleFieldChange('priority', value)}
                      >
                        <SelectTrigger className={errors.priority ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Selecione a prioridade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="urgent">🔴 Urgente</SelectItem>
                          <SelectItem value="high">🟡 Alta</SelectItem>
                          <SelectItem value="medium">🟢 Média</SelectItem>
                          <SelectItem value="low">⚪ Baixa</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.priority && (
                        <p className="text-red-500 text-sm mt-1">{errors.priority}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="author">Autor</Label>
                      <Input
                        id="author"
                        value={editedProject.author}
                        onChange={(e) => handleFieldChange('author', e.target.value)}
                        placeholder="Nome do autor"
                      />
                    </div>

                    <div>
                      <Label htmlFor="deadline">Prazo</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={editedProject.deadline || ''}
                        onChange={(e) => handleFieldChange('deadline', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="link">Link Externo</Label>
                      <Input
                        id="link"
                        value={editedProject.link || ''}
                        onChange={(e) => handleFieldChange('link', e.target.value)}
                        placeholder="https://exemplo.com"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição do Projeto *</Label>
                  <Textarea
                    id="description"
                    value={editedProject.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    className={errors.description ? 'border-red-500' : ''}
                    placeholder="Descreva os objetivos e requisitos do projeto..."
                    rows={4}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Criativos */}
            {activeTab === 'creatives' && (
              <motion.div
                key="creatives"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6 p-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Criativos do Projeto</h3>
                  <Button
                    onClick={addCreative}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Criativo</span>
                  </Button>
                </div>

                {errors.creatives && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <p className="text-red-600 text-sm">{errors.creatives}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {editedProject.creatives.map((creative, index) => (
                    <Card key={creative.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Criativo {index + 1}</CardTitle>
                          <Button
                            onClick={() => removeCreative(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Nome do Criativo *</Label>
                            <Input
                              value={creative.name}
                              onChange={(e) => handleCreativeChange(index, 'name', e.target.value)}
                              className={errors[`creative_${index}_name`] ? 'border-red-500' : ''}
                              placeholder="Nome descritivo do criativo"
                            />
                            {errors[`creative_${index}_name`] && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors[`creative_${index}_name`]}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label>Legenda/Descrição</Label>
                            <Input
                              value={creative.caption}
                              onChange={(e) => handleCreativeChange(index, 'caption', e.target.value)}
                              placeholder="Breve descrição ou legenda"
                            />
                          </div>
                        </div>

                        {/* File Upload */}
                        <div>
                          <Label>Arquivos</Label>
                          <div
                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.multiple = true;
                              input.accept = 'image/*,video/*,.pdf,.doc,.docx';
                              input.onchange = (e) => handleFileUpload(index, e.target.files);
                              input.click();
                            }}
                          >
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                              Clique para adicionar arquivos ou arraste aqui
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Suporta imagens, vídeos, PDF e documentos
                            </p>
                          </div>
                        </div>

                        {/* Attachments List */}
                        {creative.attachments.length > 0 && (
                          <div className="space-y-2">
                            <Label>Arquivos Anexados</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {creative.attachments.map(attachment => {
                                const FileIcon = getFileIcon(attachment.type);
                                return (
                                  <div
                                    key={attachment.id}
                                    className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg"
                                  >
                                    <FileIcon className="w-4 h-4 text-gray-500" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {attachment.name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {formatFileSize(attachment.size)}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => removeAttachment(index, attachment.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Configurações */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6 p-4"
              >
                <h3 className="text-lg font-semibold">Configurações do Projeto</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Status do Projeto</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select 
                        value={editedProject.status} 
                        onValueChange={(value) => handleFieldChange('status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">⏳ Pendente</SelectItem>
                          <SelectItem value="approved">✅ Aprovado</SelectItem>
                          <SelectItem value="rejected">❌ Rejeitado</SelectItem>
                          <SelectItem value="feedback-sent">💬 Feedback Enviado</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Visibilidade</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select 
                        value={editedProject.visibility || 'private'} 
                        onValueChange={(value) => handleFieldChange('visibility', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">🔒 Privado</SelectItem>
                          <SelectItem value="team">👥 Equipe</SelectItem>
                          <SelectItem value="public">🌐 Público</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tags do Projeto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input
                      value={editedProject.tags?.join(', ') || ''}
                      onChange={(e) => handleFieldChange('tags', e.target.value.split(', ').filter(Boolean))}
                      placeholder="Digite tags separadas por vírgula (ex: marketing, social, urgente)"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Use tags para organizar e filtrar seus projetos
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Observações Internas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={editedProject.internalNotes || ''}
                      onChange={(e) => handleFieldChange('internalNotes', e.target.value)}
                      placeholder="Adicione observações que serão visíveis apenas para a equipe..."
                      rows={4}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectEditModal;