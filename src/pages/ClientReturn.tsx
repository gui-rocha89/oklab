import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle2, Clock, Star, MessageSquare, Video, User, Mail, Pencil } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { ClientVideoAnnotationViewer } from "@/components/ClientVideoAnnotationViewer";

interface Project {
  id: string;
  title: string;
  client: string;
  status: string;
  type: string;
  description: string | null;
  created_at: string;
  completed_at: string | null;
  approval_date: string | null;
  video_url: string | null;
}

interface PlatformReview {
  id: string;
  rating: number;
  comment: string | null;
  client_name: string | null;
  client_email: string;
  created_at: string;
}

interface VideoAnnotation {
  id: string;
  timestamp_ms: number;
  comment: string | null;
  canvas_data: any;
  created_at: string;
}

interface SimpleComment {
  id: string;
  keyframe_id: string;
  comment: string;
  created_at: string;
}

interface UnifiedFeedback {
  id: string;
  timestamp_ms: number;
  comment: string;
  type: 'drawing' | 'simple';
  canvas_data?: any;
  created_at: string;
}

const ClientReturn = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [review, setReview] = useState<PlatformReview | null>(null);
  const [annotations, setAnnotations] = useState<VideoAnnotation[]>([]);
  const [allFeedback, setAllFeedback] = useState<UnifiedFeedback[]>([]);

  useEffect(() => {
    fetchProjectReturn();
  }, [projectId]);

  const fetchProjectReturn = async () => {
    try {
      setLoading(true);

      // Buscar projeto
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Buscar review/rating
      const { data: reviewData } = await supabase
        .from("platform_reviews")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setReview(reviewData);

      // Buscar anotações visuais (feedback detalhado do cliente)
      const { data: annotationsData } = await supabase
        .from("video_annotations")
        .select("*")
        .eq("project_id", projectId)
        .order("timestamp_ms", { ascending: true });

      setAnnotations(annotationsData || []);

      // Buscar comentários simples (sem desenho) dos keyframes
      const { data: keyframesData } = await supabase
        .from("project_keyframes")
        .select(`
          id,
          project_feedback (
            id,
            comment,
            created_at
          )
        `)
        .eq("project_id", projectId);

      // Unificar todos os feedbacks
      const unified: UnifiedFeedback[] = [];

      // Adicionar anotações visuais
      (annotationsData || []).forEach(ann => {
        unified.push({
          id: ann.id,
          timestamp_ms: ann.timestamp_ms,
          comment: ann.comment || '',
          type: 'drawing',
          canvas_data: ann.canvas_data,
          created_at: ann.created_at
        });
      });

      // Adicionar comentários simples
      (keyframesData || []).forEach(kf => {
        if (kf.project_feedback && Array.isArray(kf.project_feedback)) {
          kf.project_feedback.forEach((feedback: any) => {
            unified.push({
              id: feedback.id,
              timestamp_ms: 0, // Comentários simples não têm timestamp
              comment: feedback.comment,
              type: 'simple',
              created_at: feedback.created_at
            });
          });
        }
      });

      // Ordenar por data de criação
      unified.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setAllFeedback(unified);
    } catch (error: any) {
      console.error("Erro ao buscar retorno do cliente:", error);
      toast.error("Erro ao carregar retorno do cliente");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "success" | "warning", label: string }> = {
      pending: { variant: "warning", label: "Aguardando" },
      approved: { variant: "success", label: "Aprovado" },
      in_review: { variant: "secondary", label: "Em Revisão" },
      completed: { variant: "success", label: "Concluído" },
    };
    
    const config = variants[status] || { variant: "default", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? "fill-warning text-warning" : "text-muted"
            }`}
          />
        ))}
      </div>
    );
  };

  const formatTimestamp = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando retorno do cliente...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Projeto não encontrado</CardTitle>
            <CardDescription>
              Não foi possível encontrar o projeto solicitado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/projetos")} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Projetos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasClientReturn = project.completed_at || review || annotations.length > 0;

  return (
    <>
      <Header title="Retorno do Cliente" />
      
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/projetos")}
          className="mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Projetos
        </Button>

        {/* Informações do Projeto */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{project.title}</CardTitle>
                <CardDescription className="text-base">
                  Cliente: {project.client}
                </CardDescription>
              </div>
              {getStatusBadge(project.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Criado em</p>
                  <p className="text-muted-foreground">
                    {format(new Date(project.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>

              {project.completed_at && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <div>
                    <p className="font-medium">Retorno recebido em</p>
                    <p className="text-muted-foreground">
                      {format(new Date(project.completed_at), "dd 'de' MMM, yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}

              {project.approval_date && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <div>
                    <p className="font-medium">Aprovado em</p>
                    <p className="text-muted-foreground">
                      {format(new Date(project.approval_date), "dd 'de' MMM, yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {project.description && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">{project.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estatísticas do Retorno */}
        {hasClientReturn && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{allFeedback.length}</p>
                    <p className="text-sm text-muted-foreground">
                      Total de Comentários
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>


            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Video className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {annotations.length > 0
                        ? formatTimestamp(
                            Math.max(...annotations.map((a) => a.timestamp_ms))
                          )
                        : "00:00"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Último Comentário
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Status sem Retorno */}
        {!hasClientReturn && (
          <Card className="border-warning/50 bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-warning" />
                Aguardando Retorno do Cliente
              </CardTitle>
              <CardDescription>
                O cliente ainda não enviou feedback para este projeto.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Vídeo Aprovado pelo Cliente com Anotações */}
        {project.video_url && annotations.length > 0 && (
          <ClientVideoAnnotationViewer 
            videoUrl={project.video_url}
            annotations={annotations}
          />
        )}

        {/* Vídeo sem anotações - aprovado na íntegra */}
        {project.video_url && annotations.length === 0 && (
          <div>
            <div>
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Video className="w-5 h-5 text-primary" />
                      Vídeo Aprovado pelo Cliente
                    </CardTitle>
                    <Badge variant="success" className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Aprovado na íntegra
                    </Badge>
                  </div>
                  <CardDescription>
                    Este vídeo foi aprovado sem comentários ou modificações sugeridas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <video 
                      controls 
                      className="w-full rounded-lg aspect-video"
                      src={project.video_url}
                    >
                      Seu navegador não suporta a reprodução de vídeos.
                    </video>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <p>
                        O cliente aprovou este vídeo sem solicitar alterações. 
                        Não há anotações visuais ou comentários adicionais.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        )}

        {/* Resumo Executivo do Feedback */}
        {annotations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Resumo do Feedback
              </CardTitle>
              <CardDescription>
                Visão geral consolidada do retorno do cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Coluna Esquerda - Estatísticas */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3 text-sm text-muted-foreground">Estatísticas do Feedback</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm">Total de Anotações</span>
                        <Badge variant="secondary" className="font-bold">
                          {annotations.length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm">Anotações com Comentário</span>
                        <Badge variant="secondary" className="font-bold">
                          {allFeedback.filter(f => f.comment && f.comment.trim()).length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm">Com Desenhos</span>
                        <Badge variant="secondary" className="font-bold">
                          {allFeedback.filter(f => f.type === 'drawing').length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm">Apenas Texto</span>
                        <Badge variant="secondary" className="font-bold">
                          {allFeedback.filter(f => f.type === 'simple').length}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Avaliação Geral se existir */}
                  {review && (
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-3 text-sm text-muted-foreground">Avaliação Geral</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating)}
                          <span className="text-sm font-bold">{review.rating}/5</span>
                        </div>
                        {review.comment && (
                          <p className="text-sm bg-muted/50 p-3 rounded-lg leading-relaxed">
                            "{review.comment}"
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Coluna Direita - Comentários Consolidados */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3 text-sm text-muted-foreground">Todos os Comentários</h4>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {allFeedback
                        .filter(f => f.comment && f.comment.trim())
                        .map((feedback, index) => (
                          <div 
                            key={feedback.id}
                            className="p-3 bg-muted/30 rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {feedback.type === 'drawing' && (
                                <Badge variant="outline" className="text-xs">
                                  {formatTimestamp(feedback.timestamp_ms)}
                                </Badge>
                              )}
                              {feedback.type === 'drawing' ? (
                                <Badge variant="secondary" className="text-xs">
                                  <Pencil className="w-3 h-3 mr-1" />
                                  Com desenho
                                </Badge>
                              ) : (
                                <Badge variant="default" className="text-xs">
                                  <MessageSquare className="w-3 h-3 mr-1" />
                                  Texto
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm leading-relaxed">
                              {feedback.comment}
                            </p>
                          </div>
                        ))
                      }
                      {allFeedback.filter(f => f.comment && f.comment.trim()).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p className="text-sm">Nenhum comentário registrado.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status e Próximos Passos */}
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-3 text-sm text-muted-foreground">Próximos Passos</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                        <p className="text-muted-foreground">
                          {annotations.length} {annotations.length === 1 ? 'ponto de atenção identificado' : 'pontos de atenção identificados'}
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                        <p className="text-muted-foreground">
                          Revisar anotações visuais no player acima
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Pencil className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <p className="text-muted-foreground">
                          Implementar alterações solicitadas pelo cliente
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default ClientReturn;