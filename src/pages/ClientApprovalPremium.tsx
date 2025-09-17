import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown,
  Calendar,
  User,
  Sparkles,
  Instagram,
  ChevronDown,
  Eye,
  Check,
  Loader2,
  Download,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/logo';
import { InstagramPost } from '@/components/InstagramPost';
import { PlatformRating } from '@/components/PlatformRating';
import { DownloadSection } from '@/components/DownloadSection';
import { CreativeApprovalCard } from '@/components/CreativeApprovalCard';
import { ApprovalProgress } from '@/components/ApprovalProgress';
import { useDeliveryKit } from '@/hooks/useDeliveryKit';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CreativeApproval {
  id?: string;
  attachment_index: number;
  caption?: string;
  publish_date?: string;
  status: 'pending' | 'approved' | 'changes_requested';
  feedback?: string;
}

const ClientApprovalPremium = () => {
  const { shareId } = useParams();
  const [project, setProject] = useState(null);
  const [keyframes, setKeyframes] = useState([]);
  const [approvals, setApprovals] = useState<Record<string, CreativeApproval[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [actionCompleted, setActionCompleted] = useState(false);
  const [completedAction, setCompletedAction] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const { generateDeliveryKit, isGenerating } = useDeliveryKit();
  const { toast } = useToast();

  useEffect(() => {
    fetchProject();
  }, [shareId]);

  const fetchProject = async () => {
    try {
      setIsLoading(true);
      
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('share_id', shareId)
        .maybeSingle();

      if (projectError) {
        console.error('Error fetching project:', projectError);
        return;
      }

      if (!projectData) {
        console.log('Project not found for share_id:', shareId);
        return;
      }

      setProject(projectData);

      const { data: keyframesData, error: keyframesError } = await supabase
        .from('project_keyframes')
        .select('*')
        .eq('project_id', projectData.id)
        .order('created_at', { ascending: true });

      if (keyframesError) {
        console.error('Error fetching keyframes:', keyframesError);
      } else {
        setKeyframes(keyframesData || []);
        
        // Fetch approvals for each keyframe
        if (keyframesData && keyframesData.length > 0) {
          await fetchApprovals(keyframesData);
        }
      }

    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApprovals = async (keyframesData: any[]) => {
    try {
      const keyframeIds = keyframesData.map(kf => kf.id);
      
      const { data: approvalsData, error } = await supabase
        .from('creative_approvals')
        .select('*')
        .in('keyframe_id', keyframeIds);

      if (error) {
        console.error('Error fetching approvals:', error);
        return;
      }

      // Group approvals by keyframe_id
      const groupedApprovals: Record<string, CreativeApproval[]> = {};
      (approvalsData || []).forEach(approval => {
        if (!groupedApprovals[approval.keyframe_id]) {
          groupedApprovals[approval.keyframe_id] = [];
        }
        groupedApprovals[approval.keyframe_id].push({
          id: approval.id,
          attachment_index: approval.attachment_index,
          caption: approval.caption,
          publish_date: approval.publish_date,
          status: approval.status,
          feedback: approval.feedback
        });
      });

      setApprovals(groupedApprovals);
    } catch (error) {
      console.error('Error fetching approvals:', error);
    }
  };

  const handleApprovalUpdate = (keyframeId: string, approval: CreativeApproval) => {
    setApprovals(prev => {
      const updated = { ...prev };
      if (!updated[keyframeId]) {
        updated[keyframeId] = [];
      }
      
      const existingIndex = updated[keyframeId].findIndex(
        a => a.attachment_index === approval.attachment_index
      );
      
      if (existingIndex >= 0) {
        updated[keyframeId][existingIndex] = approval;
      } else {
        updated[keyframeId].push(approval);
      }
      
      return updated;
    });
  };

  const handleDownloadKit = async () => {
    if (!project || !keyframes) return;
    
    try {
      await generateDeliveryKit(project, keyframes, approvals);
    } catch (error) {
      console.error('Error generating delivery kit:', error);
      toast({
        title: "Erro ao Gerar Kit",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    }
  };
  
  // Calculate total approvals and check if fully approved
  const getAllApprovals = () => {
    const allApprovals: CreativeApproval[] = [];
    Object.values(approvals).forEach(keyframeApprovals => {
      allApprovals.push(...keyframeApprovals);
    });
    return allApprovals;
  };

  const getTotalCreatives = () => {
    return keyframes.reduce((total, keyframe) => {
      return total + (keyframe.attachments?.length || 0);
    }, 0);
  };

  const isFullyApproved = () => {
    const totalCreatives = getTotalCreatives();
    const allApprovals = getAllApprovals();
    const approvedCount = allApprovals.filter(a => a.status === 'approved').length;
    return totalCreatives > 0 && approvedCount === totalCreatives;
  };

  const handleAction = async (action: string) => {
    if (action === 'changes_requested' && !feedback.trim()) {
      toast({
        title: "Feedback Obrigatório",
        description: "Por favor, descreva as alterações desejadas.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    
    try {
      const { error: updateError } = await supabase
        .from('projects')
        .update({ 
          status: action,
          approval_date: action === 'approved' ? new Date().toISOString() : null
        })
        .eq('id', project.id);

      if (updateError) throw updateError;

      if (feedback.trim() && keyframes.length > 0) {
        const { error: feedbackError } = await supabase
          .from('project_feedback')
          .insert({
            keyframe_id: keyframes[0].id,
            user_id: project.user_id,
            comment: feedback,
            status: 'pending',
            x_position: 0,
            y_position: 0
          });

        if (feedbackError) {
          console.error('Error saving feedback:', feedbackError);
        }
      }

      setCompletedAction(action);
      setActionCompleted(true);
      
      // Delay before showing rating to let user see success message
      setTimeout(() => {
        setShowRating(true);
      }, 2000);

      toast({
        title: action === 'approved' ? "✨ Projeto Aprovado!" : "📝 Feedback Enviado!",
        description: action === 'approved' 
          ? "Perfeito! Vamos dar vida ao seu projeto." 
          : "Recebemos suas solicitações. Nossa equipe analisará tudo.",
      });

    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Erro",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="relative">
            <div className="w-16 h-16 animate-spin rounded-full border-4 border-primary/20 border-t-primary mx-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">OK</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Carregando seu projeto...</h3>
            <p className="text-muted-foreground">Preparando uma experiência incrível</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-md"
        >
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">🔍</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Projeto não encontrado</h1>
            <p className="text-muted-foreground">Verifique se o link de aprovação está correto.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (actionCompleted && !showRating) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <Helmet>
          <title>Ação Concluída - OK Lab</title>
        </Helmet>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-8 max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
            className="relative"
          >
            <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto">
              <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center"
            >
              <Sparkles className="w-4 h-4 text-white" />
            </motion.div>
          </motion.div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-foreground">
              {completedAction === 'approved' ? 'Projeto Aprovado!' : 'Feedback Enviado!'}
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              {completedAction === 'approved' 
                ? 'Fantástico! Nossa equipe já iniciou os preparativos para dar vida ao seu projeto. Em breve você verá resultados incríveis!' 
                : 'Recebemos suas observações! Nossa equipe criativa analisará cada detalhe para entregar exatamente o que você imagina.'
              }
            </p>
          </div>

          <div className="pt-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Aguarde... estamos preparando algo especial para você! ✨
            </p>
            <div className="w-48 h-1 bg-muted rounded-full mx-auto overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2 }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Helmet>
        <title>{project.title} - Aprovação - OK Lab</title>
        <meta name="description" content={`Aprove ou solicite alterações para o projeto: ${project.title}`} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Premium Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo className="h-10 w-auto" />
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-foreground">APROVE SEU CONTEÚDO</h1>
                <p className="text-xs text-muted-foreground">Experiência Premium de Aprovação</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-medium">
                <User className="w-3 h-3 mr-1" />
                Cliente
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="hidden md:flex"
              >
                <Eye className="w-4 h-4 mr-2" />
                {isPreviewMode ? 'Lista' : 'Preview'}
              </Button>
            </div>
          </div>
        </div>
      </header>

        <div className="container mx-auto px-4 py-8 max-w-6xl">
        <ApprovalProgress 
          approvals={getAllApprovals()}
          totalCreatives={getTotalCreatives()}
          isGeneratingKit={isGenerating}
        />
        
        {/* Project Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-primary rounded-full" />
                    <div>
                      <CardTitle className="text-2xl font-bold text-foreground">{project.title}</CardTitle>
                      {project.description && (
                        <p className="text-muted-foreground mt-1">{project.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      <span>Cliente: <strong className="text-foreground">{project.client}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>Criado em: <strong className="text-foreground">{new Date(project.created_at).toLocaleDateString('pt-BR')}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Instagram className="w-4 h-4 text-primary" />
                      <span>Para: <strong className="text-foreground">Instagram</strong></span>
                    </div>
                  </div>
                </div>
                
                <Badge 
                  variant={project.status === 'approved' ? 'default' : 'secondary'}
                  className="ml-4"
                >
                  {project.status === 'approved' ? '✅ Aprovado' : 
                   project.status === 'changes_requested' ? '📝 Alterações Solicitadas' : 
                   '⏳ Aguardando Aprovação'}
                </Badge>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Individual Creative Approval */}
        {keyframes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="w-8 h-8 bg-gradient-to-br from-pink-500 via-purple-500 to-yellow-500 rounded-lg p-0.5">
                      <div className="w-full h-full bg-background rounded-md flex items-center justify-center">
                        <Instagram className="w-4 h-4 text-foreground" />
                      </div>
                    </div>
                    Aprovação por Criativo
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {getTotalCreatives()} {getTotalCreatives() === 1 ? 'Criativo' : 'Creativos'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Revise cada criativo individualmente com legenda e cronograma de publicação
                </p>
              </CardHeader>
              <CardContent className="space-y-8">
                {keyframes.map((keyframe, keyframeIndex) => (
                  <div key={keyframe.id} className="space-y-6">
                    {/* Keyframe Title */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{keyframeIndex + 1}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">{keyframe.title}</h3>
                    </div>
                    
                    {/* Individual Creatives */}
                    {keyframe.attachments && keyframe.attachments.length > 0 ? (
                      <div className="space-y-6 ml-11">
                        {keyframe.attachments.map((attachment, attachmentIndex) => {
                          const keyframeApprovals = approvals[keyframe.id] || [];
                          const approval = keyframeApprovals.find(a => a.attachment_index === attachmentIndex);
                          
                          return (
                            <CreativeApprovalCard
                              key={`${keyframe.id}-${attachmentIndex}`}
                              keyframeId={keyframe.id}
                              attachment={attachment}
                              attachmentIndex={attachmentIndex}
                              approval={approval}
                              onApprovalUpdate={(updatedApproval) => 
                                handleApprovalUpdate(keyframe.id, updatedApproval)
                              }
                              profileName="oklab_oficial"
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center p-4 text-muted-foreground">
                        <p className="text-sm">Nenhum arquivo encontrado neste criativo.</p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Legacy Project Approval (fallback for old projects) */}
        {keyframes.length > 0 && project?.status !== 'approved' && !isFullyApproved() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <MessageSquare className="w-6 h-6 text-primary" />
                  Aprovação Geral do Projeto
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Use esta seção apenas se preferir aprovar todo o projeto de uma vez (não recomendado)
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <label className="text-sm font-medium text-foreground">
                      Feedback geral (opcional para aprovação, obrigatório para alterações)
                    </label>
                  </div>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Descreva suas observações gerais sobre o projeto..."
                    className="min-h-[120px] resize-none"
                  />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={() => handleAction('approved')}
                    disabled={submitting}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    <ThumbsUp className="w-5 h-5 mr-2" />
                    {submitting ? 'Aprovando...' : 'Aprovar Projeto Completo'}
                  </Button>
                  <Button
                    onClick={() => handleAction('changes_requested')}
                    disabled={submitting}
                    variant="outline"
                    className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                    size="lg"
                  >
                    <ThumbsDown className="w-5 h-5 mr-2" />
                    {submitting ? 'Enviando...' : 'Solicitar Alterações'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Old Instagram Preview (for reference) */}
        {false && keyframes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="w-8 h-8 bg-gradient-to-br from-pink-500 via-purple-500 to-yellow-500 rounded-lg p-0.5">
                      <div className="w-full h-full bg-background rounded-md flex items-center justify-center">
                        <Instagram className="w-4 h-4 text-foreground" />
                      </div>
                    </div>
                    Preview Instagram - Como ficará no seu feed
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {keyframes.length} {keyframes.length === 1 ? 'Post' : 'Posts'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Visualização realística de como seu conteúdo aparecerá no Instagram
                </p>
              </CardHeader>
              <CardContent>
                {isPreviewMode ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {keyframes.map((keyframe, index) => (
                      <motion.div
                        key={keyframe.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <InstagramPost
                          title={keyframe.title}
                          attachments={keyframe.attachments || []}
                          publishDate={keyframe.created_at}
                          profileName="oklab_oficial"
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {keyframes.map((keyframe, index) => (
                      <motion.div
                        key={keyframe.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border border-border rounded-xl p-6 bg-background/50"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-lg font-bold text-primary">{index + 1}</span>
                          </div>
                          <div className="flex-1 space-y-3">
                            <h3 className="font-semibold text-lg text-foreground">{keyframe.title}</h3>
                            
                            {keyframe.attachments && keyframe.attachments.length > 0 ? (
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {keyframe.attachments.map((attachment, attachIndex) => (
                                  <div 
                                    key={attachIndex} 
                                    className="group relative aspect-square bg-muted rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors"
                                  >
                                    {attachment.url ? (
                                      <img 
                                        src={attachment.url} 
                                        alt={attachment.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <div className="text-center space-y-1">
                                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                                            <span className="text-xs font-bold text-primary">OK</span>
                                          </div>
                                          <p className="text-xs font-medium text-foreground truncate px-1">
                                            {attachment.name}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                    {attachment.publicationDate && (
                                      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                        {new Date(attachment.publicationDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-muted-foreground italic">Nenhum anexo disponível</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-background/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <div className="w-1 h-1 bg-primary rounded-full" />
              <span className="text-sm">Um produto criado e desenvolvido By Stream Lab</span>
              <div className="w-1 h-1 bg-primary rounded-full" />
            </div>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Transformando ideias em experiências digitais memoráveis
            </p>
          </div>
        </div>
      </footer>

      {/* Platform Rating Modal */}
      <PlatformRating
        projectId={project?.id}
        isOpen={showRating}
        onClose={() => setShowRating(false)}
        completedAction={completedAction}
      />
    </div>
  );
};

export default ClientApprovalPremium;