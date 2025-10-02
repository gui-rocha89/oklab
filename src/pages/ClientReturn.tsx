import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, Clock, Star, MessageSquare, Video, User, Mail, Pencil, Play, Upload, Send, CheckCircle, AlertCircle, Copy, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { VideoPlayerWithKeyframes, VideoPlayerRef } from "@/components/VideoPlayerWithKeyframes";
import { AttachmentList } from "@/components/AttachmentList";
import { Attachment } from "@/lib/attachmentUtils";
import { useProjectFeedbackManagement } from "@/hooks/useProjectFeedbackManagement";
import { FeedbackHistorySection } from "@/components/FeedbackHistorySection";

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
  share_id: string;
}

interface PlatformReview {
  id: string;
  rating: number;
  comment: string | null;
  client_name: string | null;
  client_email: string;
  created_at: string;
}

interface Feedback {
  id: string;
  comment: string;
  attachments?: Attachment[];
  x_position: number;
  y_position: number;
  created_at: string;
  resolved: boolean;
  resolved_at: string | null;
  team_response: string | null;
  team_attachments: any[];
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
  project_feedback: Feedback[];
}

const ClientReturn = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [review, setReview] = useState<PlatformReview | null>(null);
  const [keyframes, setKeyframes] = useState<Keyframe[]>([]);
  const [videoDuration, setVideoDuration] = useState(0);
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [resendMessage, setResendMessage] = useState("");
  const [teamResponses, setTeamResponses] = useState<Record<string, string>>({});
  const [savingFeedback, setSavingFeedback] = useState<Record<string, boolean>>({});
  const [savedFeedback, setSavedFeedback] = useState<Record<string, boolean>>({});
  const [generatedShareLink, setGeneratedShareLink] = useState<string | null>(null);
  const videoPlayerRef = useRef<VideoPlayerRef>(null);
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const { updateFeedback, resendProject, isUpdating, isResending, uploadProgress } = useProjectFeedbackManagement();

  useEffect(() => {
    fetchProjectReturn();
  }, [projectId]);

  // Separar feedbacks históricos de atuais - APÓS loading/null checks
  const historicalKeyframes = project ? keyframes.filter(kf => 
    kf.project_feedback.length > 0 && 
    kf.project_feedback.every(f => f.resolved === true && f.team_response)
  ) : [];

  const currentKeyframes = project ? keyframes.filter(kf => 
    kf.project_feedback.some(f => f.resolved === false)
  ) : [];

  const totalComments = currentKeyframes.reduce((sum, kf) => sum + kf.project_feedback.length, 0);
  const resolvedComments = currentKeyframes.reduce(
    (sum, kf) => sum + kf.project_feedback.filter(f => f.resolved).length, 
    0
  );

  const isInNewRound = project?.status === 'in-revision' && historicalKeyframes.length > 0;

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

      console.log('📦 Keyframes com feedbacks:', keyframesData);
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
      "feedback-sent": { variant: "secondary", label: "Feedback Enviado" },
      "in-revision": { variant: "warning", label: "Em Revisão" },
      "feedback-resent": { variant: "secondary", label: "Reenviado" },
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

  const handleResolveToggle = async (feedbackId: string, currentResolved: boolean) => {
    // Optimistic update - atualizar UI imediatamente
    setKeyframes(prev => prev.map(kf => ({
      ...kf,
      project_feedback: kf.project_feedback.map(f => 
        f.id === feedbackId ? { ...f, resolved: !currentResolved } : f
      )
    })));

    // Fazer chamada ao servidor em background
    const success = await updateFeedback(feedbackId, { resolved: !currentResolved });
    
    if (!success) {
      // Se falhar, reverter estado local
      await fetchProjectReturn();
    }
  };

  const handleTeamResponseChange = (feedbackId: string, response: string) => {
    setTeamResponses(prev => ({ ...prev, [feedbackId]: response }));
    
    // Clear existing timer
    if (debounceTimers.current[feedbackId]) {
      clearTimeout(debounceTimers.current[feedbackId]);
    }
    
    // Clear saved indicator
    setSavedFeedback(prev => ({ ...prev, [feedbackId]: false }));
    
    // Set new timer for auto-save
    debounceTimers.current[feedbackId] = setTimeout(async () => {
      if (response.trim()) {
        setSavingFeedback(prev => ({ ...prev, [feedbackId]: true }));
        
        const success = await updateFeedback(feedbackId, { team_response: response });
        
        setSavingFeedback(prev => ({ ...prev, [feedbackId]: false }));
        
        if (success) {
          setSavedFeedback(prev => ({ ...prev, [feedbackId]: true }));
          // Clear saved indicator after 3 seconds
          setTimeout(() => {
            setSavedFeedback(prev => ({ ...prev, [feedbackId]: false }));
          }, 3000);
        }
      }
    }, 2000);
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const maxSize = 500 * 1024 * 1024; // 500MB
    
    if (file.size > maxSize) {
      toast.error("Vídeo muito grande! Tamanho máximo: 500MB");
      e.target.value = '';
      return;
    }
    
    setNewVideoFile(file);
    toast.success(`Vídeo selecionado: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
  };

  const handleResendProject = async () => {
    if (!newVideoFile) {
      toast.error("Selecione um vídeo corrigido para enviar");
      return;
    }

    if (!projectId) return;

    const result = await resendProject(projectId, newVideoFile, resendMessage);
    
    if (result) {
      setGeneratedShareLink(result.shareUrl);
      setNewVideoFile(null);
      setResendMessage("");
      fetchProjectReturn();
    }
  };

  const copyLinkToClipboard = () => {
    if (generatedShareLink) {
      navigator.clipboard.writeText(generatedShareLink);
      toast.success("Link copiado para a área de transferência!");
    }
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

        {/* Histórico de Correções (Read-only) */}
        {historicalKeyframes.length > 0 && (
          <FeedbackHistorySection
            keyframes={historicalKeyframes}
            roundNumber={1}
            formatTime={formatTime}
          />
        )}

        {/* Progresso de Ajustes - Apenas para feedbacks atuais */}
        {currentKeyframes.length > 0 && totalComments > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Progresso dos Ajustes - Rodada {isInNewRound ? 2 : 1}
              </CardTitle>
              <CardDescription>
                {resolvedComments} de {totalComments} ajustes marcados como resolvidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-500"
                    style={{ width: `${totalComments > 0 ? (resolvedComments / totalComments) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-primary">
                  {totalComments > 0 ? Math.round((resolvedComments / totalComments) * 100) : 0}%
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aguardando Novos Feedbacks após Reenvio */}
        {isInNewRound && currentKeyframes.length === 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-warning" />
                Aguardando Novos Feedbacks do Cliente
              </CardTitle>
              <CardDescription>
                O vídeo foi reenviado com as correções. Assim que o cliente enviar novos comentários, eles aparecerão aqui para gestão.
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
                {isApprovedWithoutChanges && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Aprovado na íntegra
                  </Badge>
                )}
              </div>
              <CardDescription>
                {isApprovedWithoutChanges 
                  ? "Vídeo aprovado sem comentários ou modificações" 
                  : `${keyframes.length} momento${keyframes.length !== 1 ? 's' : ''} com feedback do cliente`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <VideoPlayerWithKeyframes
                  ref={videoPlayerRef}
                  src={project.video_url!}
                  keyframes={keyframes}
                  onDurationChange={setVideoDuration}
                />

                {/* Gestão de Ajustes - Apenas Feedbacks Atuais */}
                {currentKeyframes.length > 0 && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Pencil className="w-4 h-4" />
                      Gestão de Ajustes {isInNewRound ? '- Rodada 2' : ''}
                    </h3>
                    <div className="space-y-3">
                      {currentKeyframes.map((keyframe) => {
                        const timeInSeconds = keyframe.attachments[0]?.time || 0;
                        const commentsCount = keyframe.project_feedback?.length || 0;
                        
                        return (
                          <Card 
                            key={keyframe.id} 
                            className="border-l-4 border-l-primary"
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                                    <Badge 
                                      variant="outline" 
                                      className="font-mono flex items-center gap-1 cursor-pointer hover:bg-accent"
                                      onClick={() => seekToTime(timeInSeconds)}
                                    >
                                      <Play className="w-3 h-3" />
                                      {formatTime(timeInSeconds)}
                                    </Badge>
                                    <span>{keyframe.title}</span>
                                  </CardTitle>
                                </div>
                              </div>
                            </CardHeader>
                            {commentsCount > 0 && (
                              <CardContent className="pt-0 space-y-4">
                                {keyframe.project_feedback.map((feedback) => (
                                  <div 
                                    key={feedback.id} 
                                    className={`rounded-lg p-4 border-2 transition-all ${
                                      feedback.resolved 
                                        ? 'bg-green-50 border-green-200 dark:bg-green-950/20' 
                                        : 'bg-muted/30 border-border'
                                    }`}
                                  >
                                    {/* Checkbox e Comentário do Cliente */}
                                    <div className="flex items-start gap-3 mb-3">
                                      <Checkbox
                                        checked={feedback.resolved}
                                        onCheckedChange={() => handleResolveToggle(feedback.id, feedback.resolved)}
                                        disabled={isUpdating}
                                        className="mt-1"
                                      />
                                      <div className="flex-1">
                                        <div className="flex items-start gap-2">
                                          <MessageSquare className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                                          <div className="flex-1">
                                            <p className="text-sm font-medium mb-1">Comentário do Cliente:</p>
                                            <p className="text-sm">{feedback.comment}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                              {format(new Date(feedback.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                            </p>
                                          </div>
                                        </div>
                                        
                                        {feedback.attachments && feedback.attachments.length > 0 && (
                                          <div className="ml-6 mt-2">
                                            <AttachmentList
                                              attachments={feedback.attachments}
                                              editable={false}
                                            />
                                          </div>
                                        )}

                                        {feedback.resolved && feedback.resolved_at && (
                                          <div className="ml-6 mt-2 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                                            <CheckCircle className="w-3 h-3" />
                                            Resolvido em {format(new Date(feedback.resolved_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <Separator className="my-3" />

                                    {/* Resposta da Equipe */}
                                    <div className="ml-9 space-y-2">
                                      <Label className="text-sm font-medium">Resposta da Equipe:</Label>
                                      
                                      <div className="space-y-2">
                                        <Textarea
                                          placeholder="Descreva o que foi ajustado ou responda ao comentário..."
                                          value={teamResponses[feedback.id] || feedback.team_response || ''}
                                          onChange={(e) => handleTeamResponseChange(feedback.id, e.target.value)}
                                          className="min-h-[80px]"
                                        />
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                          {savingFeedback[feedback.id] && (
                                            <>
                                              <Loader2 className="w-3 h-3 animate-spin" />
                                              <span>Salvando...</span>
                                            </>
                                          )}
                                          {savedFeedback[feedback.id] && (
                                            <>
                                              <CheckCircle className="w-3 h-3 text-green-600" />
                                              <span className="text-green-600">Salvo automaticamente</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
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

        {/* Seção de Reenvio de Vídeo Corrigido */}
        {currentKeyframes.length > 0 && totalComments > 0 && (
          <>
            {generatedShareLink ? (
              <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    Link Gerado com Sucesso!
                  </CardTitle>
                  <CardDescription>
                    O vídeo foi atualizado e o cliente pode acessar as correções através do link abaixo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Link de Aprovação:</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={generatedShareLink} 
                        readOnly 
                        className="font-mono text-sm"
                      />
                      <Button
                        onClick={copyLinkToClipboard}
                        variant="outline"
                        size="icon"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      ℹ️ O vídeo foi atualizado com sucesso. Envie este link para o cliente revisar as correções.
                    </p>
                  </div>

                  <Button
                    onClick={() => setGeneratedShareLink(null)}
                    variant="outline"
                    className="w-full"
                  >
                    Fazer Novo Reenvio
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-primary" />
                    Reenviar Projeto Corrigido
                  </CardTitle>
                  <CardDescription>
                    Faça upload do vídeo corrigido e gere um novo link para o cliente. O link de aprovação será atualizado com o novo conteúdo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="video-upload">Novo Vídeo Corrigido (máx. 500MB)</Label>
                    <Input
                      id="video-upload"
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileChange}
                      className="cursor-pointer"
                    />
                    {newVideoFile && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {newVideoFile.name} ({(newVideoFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>

                  {isResending && uploadProgress > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Enviando vídeo...</span>
                        <span className="font-semibold text-primary">{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="resend-message">Mensagem para o Cliente (Opcional)</Label>
                    <Textarea
                      id="resend-message"
                      placeholder="Ex: Fizemos todos os ajustes solicitados. Por favor, revise novamente."
                      value={resendMessage}
                      onChange={(e) => setResendMessage(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-warning" />
                      Ao gerar novo link:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                      <li>O vídeo atual será substituído pelo novo</li>
                      <li>O status mudará para "Em Revisão"</li>
                      <li>Os checkboxes de "resolvido" serão desmarcados</li>
                      <li>Um novo link será gerado para enviar ao cliente</li>
                      <li>As respostas da equipe serão preservadas</li>
                    </ul>
                  </div>

                  <Button
                    onClick={handleResendProject}
                    disabled={!newVideoFile || isResending}
                    className="w-full"
                    size="lg"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {uploadProgress > 0 ? `Enviando... ${uploadProgress}%` : 'Processando...'}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Gerar Novo Link para Enviar ao Cliente
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default ClientReturn;