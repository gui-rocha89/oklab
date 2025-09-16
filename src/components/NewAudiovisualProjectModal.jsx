import React, { useState, useEffect, useRef } from "react";
import { X, Upload, Film, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const NewAudiovisualProjectModal = ({ isOpen, setIsOpen, onProjectCreate }) => {
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setComment('');
      setVideoFile(null);
    }
  }, [isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      toast({
        title: "Vídeo Anexado",
        description: `${file.name} foi selecionado com sucesso.`,
      });
    } else {
      toast({
        title: "Formato Inválido",
        description: "Por favor, selecione um arquivo de vídeo.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast({
        title: "Erro de Validação",
        description: "O título do projeto é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    if (!videoFile) {
      toast({
        title: "Erro de Validação",
        description: "É necessário anexar um vídeo.",
        variant: "destructive",
      });
      return;
    }

    const newProject = {
      title,
      comment,
      videoFile,
    };
    onProjectCreate(newProject);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Film className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold">Novo Projeto Audiovisual</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Título do Vídeo */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">
              Título do Vídeo
            </Label>
            <Input 
              id="title"
              placeholder="Ex: Vídeo Institucional 2025"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Arquivo de Vídeo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Arquivo de Vídeo
            </Label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="video/*"
                onChange={handleFileChange}
              />
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">Arraste ou clique para enviar</p>
              <p className="text-xs text-gray-500">Formatos de vídeo suportados (MP4, MOV, etc.)</p>
            </div>
            {videoFile && (
              <p className="text-sm text-green-600 mt-2">
                ✅ {videoFile.name}
              </p>
            )}
          </div>

          {/* Comentários / Descrição */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-sm font-medium text-gray-700">
              Comentários / Descrição
            </Label>
            <Textarea
              id="comment"
              placeholder="Adicione uma descrição, observações ou o roteiro do vídeo aqui..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="bg-orange-500 hover:bg-orange-600 text-white">
            <FileText className="w-4 h-4 mr-2" />
            Criar e enviar para aprovação
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewAudiovisualProjectModal;