import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Film, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const NewAudiovisualProjectModal = ({ isOpen, setIsOpen, onProjectCreate }) => {
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Aplicar blur no fundo da página
      document.body.style.filter = 'blur(2px)';
      document.body.style.pointerEvents = 'none';
      
      // Reset form quando modal abre
      setTitle('');
      setComment('');
      setVideoFile(null);
    } else {
      // Remover blur quando modal fecha
      document.body.style.filter = '';
      document.body.style.pointerEvents = '';
    }

    // Cleanup ao desmontar
    return () => {
      document.body.style.filter = '';
      document.body.style.pointerEvents = '';
    };
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
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop com blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal acima do backdrop */}
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 my-8 flex flex-col pointer-events-auto"
              style={{ maxHeight: '90vh' }}
            >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Film className="h-6 w-6 text-orange-500" />
                <h2 className="text-2xl font-bold text-gray-900">Novo Projeto Audiovisual</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="overflow-y-auto p-8 space-y-8 flex-1">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="av-title" className="text-base font-semibold">Título do Vídeo</Label>
                  <Input id="av-title" placeholder="Ex: Vídeo Institucional 2025" value={title} onChange={(e) => setTitle(e.target.value)} className="text-base py-6" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="av-video" className="text-base font-semibold">Arquivo de Vídeo</Label>
                  <div
                    className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-all"
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
                        <p className="text-sm text-gray-600">{videoFile.name}</p>
                        <Button variant="link" size="sm" className="mt-2 text-sm">Trocar arquivo</Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Upload className="h-12 w-12 mb-3 text-gray-400" />
                        <p className="font-semibold text-lg">Arraste ou clique para enviar</p>
                        <p className="text-sm">Formatos de vídeo suportados (MP4, MOV, etc.)</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="av-comment" className="text-base font-semibold">Comentários / Descrição</Label>
                  <Textarea id="av-comment" placeholder="Adicione uma descrição, observações ou o roteiro do vídeo aqui..." value={comment} onChange={(e) => setComment(e.target.value)} rows={5} />
                </div>
              </div>
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200">
              <div className="flex gap-4">
                <Button variant="outline" size="lg" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button className="btn-primary" size="lg" onClick={handleSubmit}>
                  <FileText className="w-5 h-5 mr-2" />
                  Criar e Enviar para Aprovação
                </Button>
              </div>
            </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NewAudiovisualProjectModal;