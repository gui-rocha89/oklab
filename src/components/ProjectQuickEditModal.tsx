import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge, WorkflowStatus } from "@/components/StatusBadge";
import { Loader2 } from "lucide-react";

interface Project {
  id: string;
  title: string;
  client: string;
  description?: string;
  type: string;
  status: string;
}

interface ProjectQuickEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSave: (projectId: string, updates: Partial<Project>) => Promise<void>;
}

export const ProjectQuickEditModal = ({
  isOpen, 
  onClose, 
  project,
  onSave 
}: ProjectQuickEditModalProps) => {
  const [formData, setFormData] = useState({
    title: "",
    client: "",
    description: "",
    status: "pending" as WorkflowStatus
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || "",
        client: project.client || "",
        description: project.description || "",
        status: (project.status || "pending") as WorkflowStatus
      });
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    setIsSaving(true);
    try {
      await onSave(project.id, formData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = (newStatus: WorkflowStatus) => {
    setFormData(prev => ({ ...prev, status: newStatus }));
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] !bg-background" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Editar Projeto</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Projeto</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Nome do projeto"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Cliente</Label>
            <Input
              id="client"
              value={formData.client}
              onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
              placeholder="Nome do cliente"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição do projeto"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Status do Projeto</Label>
            <div className="flex items-center gap-2">
              <StatusBadge 
                currentStatus={formData.status}
                onChange={handleStatusChange}
              />
              <span className="text-xs text-muted-foreground">
                Clique para alterar
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
