import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, Link as LinkIcon, X, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Attachment,
  isValidFileType,
  isValidFileSize,
  isValidVideoLink,
  formatFileSize,
  getFileType,
  sanitizeFileName,
  MAX_FILE_SIZE,
  MAX_ATTACHMENTS,
  ALL_ACCEPTED_TYPES,
} from "@/lib/attachmentUtils";
import { Progress } from "@/components/ui/progress";

interface AttachmentUploaderProps {
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  maxFileSize?: number;
  disabled?: boolean;
}

export function AttachmentUploader({
  attachments,
  onAttachmentsChange,
  maxFileSize = MAX_FILE_SIZE,
  disabled = false,
}: AttachmentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [videoLink, setVideoLink] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > MAX_ATTACHMENTS) {
      toast({
        title: "Limite excedido",
        description: `Você pode anexar no máximo ${MAX_ATTACHMENTS} arquivos por comentário.`,
        variant: "destructive",
      });
      return;
    }

    const filesArray = Array.from(files);
    
    for (const file of filesArray) {
      if (!isValidFileType(file)) {
        toast({
          title: "Tipo de arquivo não suportado",
          description: `O arquivo "${file.name}" não é um tipo aceito.`,
          variant: "destructive",
        });
        continue;
      }

      if (!isValidFileSize(file)) {
        toast({
          title: "Arquivo muito grande",
          description: `O arquivo "${file.name}" excede o limite de ${formatFileSize(maxFileSize)}.`,
          variant: "destructive",
        });
        continue;
      }

      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const timestamp = Date.now();
      const sanitizedName = sanitizeFileName(file.name);
      const filePath = `${timestamp}-${sanitizedName}`;

      const { data, error } = await supabase.storage
        .from("feedback-attachments")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("feedback-attachments")
        .getPublicUrl(data.path);

      const newAttachment: Attachment = {
        id: crypto.randomUUID(),
        name: file.name,
        url: publicUrl,
        type: getFileType(file.type),
        mimeType: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      };

      onAttachmentsChange([...attachments, newAttachment]);

      toast({
        title: "Arquivo anexado",
        description: `${file.name} foi anexado com sucesso.`,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Erro ao fazer upload",
        description: "Não foi possível fazer upload do arquivo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleAddVideoLink = () => {
    if (!videoLink.trim()) return;

    if (!isValidVideoLink(videoLink)) {
      toast({
        title: "Link inválido",
        description: "Por favor, insira um link válido do YouTube, Vimeo ou Loom.",
        variant: "destructive",
      });
      return;
    }

    if (attachments.length >= MAX_ATTACHMENTS) {
      toast({
        title: "Limite excedido",
        description: `Você pode anexar no máximo ${MAX_ATTACHMENTS} itens por comentário.`,
        variant: "destructive",
      });
      return;
    }

    const newAttachment: Attachment = {
      id: crypto.randomUUID(),
      name: "Link de vídeo",
      url: videoLink,
      type: "video-link",
      mimeType: "text/uri-list",
      size: 0,
      uploadedAt: new Date().toISOString(),
    };

    onAttachmentsChange([...attachments, newAttachment]);
    setVideoLink("");
    setShowLinkInput(false);

    toast({
      title: "Link adicionado",
      description: "Link de vídeo anexado com sucesso.",
    });
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    onAttachmentsChange(attachments.filter((a) => a.id !== attachmentId));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading || attachments.length >= MAX_ATTACHMENTS}
        >
          <Paperclip className="h-4 w-4 mr-2" />
          Anexar Arquivo
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowLinkInput(!showLinkInput)}
          disabled={disabled || attachments.length >= MAX_ATTACHMENTS}
        >
          <LinkIcon className="h-4 w-4 mr-2" />
          Link de Vídeo
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALL_ACCEPTED_TYPES}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {showLinkInput && (
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="Cole o link do YouTube, Vimeo ou Loom..."
            value={videoLink}
            onChange={(e) => setVideoLink(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddVideoLink()}
          />
          <Button type="button" size="sm" onClick={handleAddVideoLink}>
            Adicionar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowLinkInput(false);
              setVideoLink("");
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Upload className="h-4 w-4 animate-pulse" />
            <span>Fazendo upload...</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      {attachments.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {attachments.length} / {MAX_ATTACHMENTS} anexos
        </div>
      )}
    </div>
  );
}
