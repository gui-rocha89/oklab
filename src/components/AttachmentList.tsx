import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, ExternalLink, Eye } from "lucide-react";
import { Attachment, formatFileSize, getFileIcon } from "@/lib/attachmentUtils";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AttachmentListProps {
  attachments: Attachment[];
  onRemove?: (attachmentId: string) => void;
  editable?: boolean;
}

export function AttachmentList({
  attachments,
  onRemove,
  editable = false,
}: AttachmentListProps) {
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const handleDownload = async (attachment: Attachment) => {
    if (attachment.type === "video-link") {
      window.open(attachment.url, "_blank");
      return;
    }

    try {
      const response = await fetch(attachment.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const renderPreviewContent = () => {
    if (!previewAttachment) return null;

    if (previewAttachment.type === "image") {
      return (
        <img
          src={previewAttachment.url}
          alt={previewAttachment.name}
          className="w-full h-auto max-h-[70vh] object-contain"
        />
      );
    }

    if (previewAttachment.type === "video") {
      return (
        <video
          src={previewAttachment.url}
          controls
          className="w-full h-auto max-h-[70vh]"
        >
          Seu navegador não suporta a reprodução de vídeo.
        </video>
      );
    }

    if (previewAttachment.type === "video-link") {
      return (
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Link de vídeo externo
          </p>
          <Button
            onClick={() => window.open(previewAttachment.url, "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir Vídeo
          </Button>
        </div>
      );
    }

    return (
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">
          Preview não disponível para este tipo de arquivo.
        </p>
        <Button onClick={() => handleDownload(previewAttachment)}>
          <Download className="h-4 w-4 mr-2" />
          Baixar Arquivo
        </Button>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground font-medium">
          Anexos ({attachments.length})
        </div>
        <div className="space-y-2">
          {attachments.map((attachment) => {
            const { icon, color } = attachment.type === "video-link"
              ? { icon: "🔗", color: "bg-orange-100 text-orange-700" }
              : getFileIcon(attachment.name);

            return (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border"
              >
                <Badge className={`${color} text-lg px-2 py-1`} variant="secondary">
                  {icon}
                </Badge>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {attachment.name}
                  </div>
                  {attachment.size > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)}
                    </div>
                  )}
                </div>

                <div className="flex gap-1">
                  {(attachment.type === "image" || attachment.type === "video") && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewAttachment(attachment)}
                      title="Visualizar"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(attachment)}
                    title={attachment.type === "video-link" ? "Abrir link" : "Baixar"}
                  >
                    {attachment.type === "video-link" ? (
                      <ExternalLink className="h-4 w-4" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>

                  {editable && onRemove && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(attachment.id)}
                      title="Remover"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={!!previewAttachment} onOpenChange={() => setPreviewAttachment(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewAttachment?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {renderPreviewContent()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
