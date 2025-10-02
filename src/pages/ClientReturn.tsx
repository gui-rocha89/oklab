import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle2, Clock, Star, MessageSquare, Video, User, Mail, Pencil, Play } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { VideoPlayerWithKeyframes, VideoPlayerRef } from "@/components/VideoPlayerWithKeyframes";



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

interface Keyframe {
  id: string;
  title: string;
  attachments: Array<{
    time: number;
    timeStr: string;
    type: string;
  }>;
  feedback_count: number;
  project_feedback: Array<{
    id: string;
    comment: string;
    x_position: number;
    y_position: number;
    created_at: string;
  }>;
}


const ClientReturn = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [review, setReview] = useState<PlatformReview | null>(null);
  const [keyframes, setKeyframes] = useState<Keyframe[]>([]);
  const [videoDuration, setVideoDuration] = useState(0);
  const videoPlayerRef = useRef<VideoPlayerRef>(null);

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

      // Buscar keyframes com feedback
      const { data: keyframesData } = await supabase
        .from("project_keyframes")
        .select("*, project_feedback(*)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      setKeyframes(keyframesData || []);

      // Buscar review/rating
      const { data: reviewData } = await supabase
        .from("platform_reviews")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setReview(reviewData);
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


  const seekToTime = (timeInSeconds: number) => {
    videoPlayerRef.current?.seekTo(timeInSeconds);
    toast.success(`Pausado em ${formatTime(timeInSeconds)}`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  const hasClientReturn = project.completed_at || review;
  const hasKeyframes = keyframes.length > 0;
  const totalComments = keyframes.reduce((sum, kf) => sum + kf.project_feedback.length, 0);
  const isApprovedWithoutChanges = hasClientReturn && !hasKeyframes;

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

        {/* Vídeo com keyframes e comentários */}
        {project.video_url && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  Vídeo do Projeto
                </CardTitle>
                {isApprovedWithoutChanges ? (
                  <Badge variant="success" className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Aprovado na íntegra
                  </Badge>
                ) : totalComments > 0 ? (
                  <Badge variant="warning" className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {totalComments} comentário{totalComments !== 1 ? 's' : ''}
                  </Badge>
                ) : null}
              </div>
              <CardDescription>
                {isApprovedWithoutChanges 
                  ? "Vídeo aprovado sem comentários ou modificações" 
                  : `${keyframes.length} momento${keyframes.length !== 1 ? 's' : ''} com feedback do cliente`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Custom Video Player with Integrated Keyframes */}
                <VideoPlayerWithKeyframes
                  ref={videoPlayerRef}
                  src={project.video_url!}
                  keyframes={keyframes}
                  onDurationChange={setVideoDuration}
                />

                {/* Timeline de keyframes */}
                {hasKeyframes && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Pencil className="w-4 h-4" />
                      Momentos com Comentários
                    </h3>
                    <div className="space-y-3">
                      {keyframes.map((keyframe) => {
                        const timeInSeconds = keyframe.attachments[0]?.time || 0;
                        const commentsCount = keyframe.project_feedback?.length || 0;
                        
                        return (
                          <Card 
                            key={keyframe.id} 
                            className="border-l-4 border-l-primary hover:bg-accent/50 transition-colors cursor-pointer"
                            onClick={() => seekToTime(timeInSeconds)}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className="font-mono flex items-center gap-1">
                                      <Play className="w-3 h-3" />
                                      {formatTime(timeInSeconds)}
                                    </Badge>
                                    <span>{keyframe.title}</span>
                                  </CardTitle>
                                  <CardDescription className="mt-1">
                                    {commentsCount > 0 ? (
                                      <span>{commentsCount} comentário{commentsCount !== 1 ? 's' : ''}</span>
                                    ) : (
                                      <span className="text-muted-foreground/60">Marcação sem comentários</span>
                                    )}
                                  </CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            {commentsCount > 0 && (
                              <CardContent className="pt-0">
                                <div className="space-y-2">
                                  {keyframe.project_feedback.map((feedback) => (
                                    <div 
                                      key={feedback.id} 
                                      className="bg-muted/30 rounded-lg p-3 text-sm"
                                    >
                                      <div className="flex items-start gap-2">
                                        <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                        <p className="flex-1">{feedback.comment}</p>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1 ml-6">
                                        {format(new Date(feedback.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </>
  );
};

export default ClientReturn;