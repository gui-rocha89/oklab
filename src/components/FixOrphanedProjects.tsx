import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Upload, Trash2, Loader2 } from "lucide-react";
import { useProjects } from "@/contexts/ProjectContext";

interface OrphanedProject {
  id: string;
  title: string;
  client: string;
  created_at: string;
  status: string;
}

export const FixOrphanedProjects = () => {
  const [orphanedProjects, setOrphanedProjects] = useState<OrphanedProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFixing, setIsFixing] = useState<string | null>(null);
  const { toast } = useToast();
  const { refreshProjects } = useProjects();

  const findOrphanedProjects = async () => {
    setIsLoading(true);
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, client, created_at, status')
        .eq('type', 'Audiovisual')
        .eq('status', 'uploading')
        .is('video_url', null)
        .lt('created_at', fiveMinutesAgo);

      if (error) throw error;

      setOrphanedProjects(data || []);
      
      if (data && data.length > 0) {
        toast({
          title: "Projetos Órfãos Encontrados",
          description: `Encontrados ${data.length} projeto(s) com problema de upload.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Nenhum Problema Encontrado",
          description: "Todos os projetos estão funcionando corretamente.",
        });
      }
    } catch (error) {
      console.error('Erro ao buscar projetos órfãos:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar projetos com problema.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsError = async (projectId: string) => {
    setIsFixing(projectId);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: 'error' })
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: "✅ Projeto Marcado como Erro",
        description: "O projeto foi marcado como erro. Você pode criar um novo projeto.",
      });

      await refreshProjects();
      setOrphanedProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (error) {
      console.error('Erro ao marcar como erro:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar o projeto.",
        variant: "destructive",
      });
    } finally {
      setIsFixing(null);
    }
  };

  const deleteOrphanedProject = async (projectId: string) => {
    setIsFixing(projectId);
    try {
      const { error } = await supabase.functions.invoke('delete-project', {
        body: { projectId }
      });

      if (error) throw error;

      toast({
        title: "✅ Projeto Excluído",
        description: "O projeto órfão foi removido do sistema.",
      });

      await refreshProjects();
      setOrphanedProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir o projeto.",
        variant: "destructive",
      });
    } finally {
      setIsFixing(null);
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          Corrigir Projetos com Falha de Upload
        </CardTitle>
        <CardDescription>
          Encontre e corrija projetos audiovisuais que ficaram presos em "processamento"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={findOrphanedProjects} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Buscando...
            </>
          ) : (
            "🔍 Buscar Projetos com Problema"
          )}
        </Button>

        {orphanedProjects.length > 0 && (
          <div className="space-y-3 mt-4">
            <h4 className="font-semibold text-sm">Projetos Encontrados:</h4>
            {orphanedProjects.map((project) => (
              <Card key={project.id} className="border-red-200 bg-red-50/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold">{project.title}</p>
                      <p className="text-sm text-muted-foreground">Cliente: {project.client}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Criado em: {new Date(project.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsError(project.id)}
                        disabled={isFixing === project.id}
                        className="text-xs"
                      >
                        {isFixing === project.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Marcar Erro
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteOrphanedProject(project.id)}
                        disabled={isFixing === project.id}
                        className="text-xs"
                      >
                        {isFixing === project.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="w-3 h-3 mr-1" />
                            Excluir
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};