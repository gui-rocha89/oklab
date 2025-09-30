import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Reply, 
  Filter,
  Send,
  Eye,
  Calendar,
  User,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  Video
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useProjects } from '@/contexts/ProjectContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { AudiovisualFeedbackPanel } from './AudiovisualFeedbackPanel';
import { supabase } from '@/integrations/supabase/client';

const FeedbackList = () => {
  // Estados para filtros conforme Task 1
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [responseText, setResponseText] = useState('');
  const [respondingTo, setRespondingTo] = useState(null);
  const [audiovisualProjects, setAudiovisualProjects] = useState({});
  const [selectedAudiovisual, setSelectedAudiovisual] = useState(null);
  
  const { projects, addFeedbackResponse, updateFeedbackStatus, getAllFeedbacks } = useProjects();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Task 1: Buscar todos os feedbacks de todos os projetos usando o contexto
  const allFeedbacks = getAllFeedbacks();

  // Carregar informações de projetos audiovisuais
  useEffect(() => {
    const loadAudiovisualProjects = async () => {
      const projectIds = [...new Set(allFeedbacks.map(f => f.projectId))];
      
      const { data, error } = await supabase
        .from('projects')
        .select('id, video_url, share_id, type')
        .in('id', projectIds)
        .not('video_url', 'is', null);

      if (data && !error) {
        const projectsMap = {};
        data.forEach(p => {
          projectsMap[p.id] = p;
        });
        setAudiovisualProjects(projectsMap);
      }
    };

    if (allFeedbacks.length > 0) {
      loadAudiovisualProjects();
    }
  }, [allFeedbacks.length]);

  // Utility functions para status e cores
  const getStatusConfig = (status) => {
    const configs = {
      pending: { 
        color: 'bg-amber-100 text-amber-800 border-amber-300', 
        label: 'Pendente',
        icon: Clock,
        textColor: 'text-amber-600'
      },
      resolved: { 
        color: 'bg-emerald-100 text-emerald-800 border-emerald-300', 
        label: 'Resolvido',
        icon: CheckCircle,
        textColor: 'text-emerald-600'
      },
      rejected: { 
        color: 'bg-red-100 text-red-800 border-red-300', 
        label: 'Rejeitado',
        icon: XCircle,
        textColor: 'text-red-600'
      }
    };
    return configs[status] || configs.pending;
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Task 1: Lógica de filtragem
  const filteredFeedbacks = allFeedbacks.filter(feedback => {
    const matchesSearch = feedback.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || feedback.status === statusFilter;
    const matchesProject = projectFilter === 'all' || feedback.projectId.toString() === projectFilter;
    
    return matchesSearch && matchesStatus && matchesProject;
  });

  // Task 1: Cálculo das métricas
  const stats = {
    total: allFeedbacks.length,
    pending: allFeedbacks.filter(f => f.status === 'pending').length,
    resolved: allFeedbacks.filter(f => f.status === 'resolved').length,
    rejected: allFeedbacks.filter(f => f.status === 'rejected').length,
    // Métricas adicionais
    responseRate: allFeedbacks.length > 0 ? ((allFeedbacks.filter(f => f.response).length / allFeedbacks.length) * 100).toFixed(1) : 0,
    avgResponseTime: '2.5h' // Mock - em uma aplicação real, seria calculado
  };

  // Projetos únicos para filtro
  const uniqueProjects = Array.from(new Set(allFeedbacks.map(f => ({ id: f.projectId, title: f.projectTitle }))))
    .filter((project, index, self) => self.findIndex(p => p.id === project.id) === index);

  // Task 3: Sistema de respostas aos feedbacks
  const handleResponse = async (feedbackId) => {
    if (!responseText.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite uma resposta antes de enviar.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Usar a função do contexto para adicionar resposta
      const [projectId, keyframeId] = feedbackId.split('-').map(Number);
      addFeedbackResponse(projectId, keyframeId, responseText, 'Equipe de Produção');

      toast({
        title: "✅ Resposta Enviada!",
        description: "Sua resposta foi registrada com sucesso.",
      });

      setRespondingTo(null);
      setResponseText('');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a resposta. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleViewProject = (shareId, time) => {
    const url = `/aprovacao-audiovisual/${shareId}`;
    if (time && time > 0) {
      navigate(`${url}?t=${time}`);
    } else {
      navigate(url);
    }
  };

  const markAsResolved = (feedbackId) => {
    const [projectId, keyframeId] = feedbackId.split('-').map(Number);
    updateFeedbackStatus(projectId, keyframeId, 'resolved');
    toast({
      title: "✅ Feedback Resolvido",
      description: "Feedback marcado como resolvido.",
    });
  };

  const markAsRejected = (feedbackId) => {
    const [projectId, keyframeId] = feedbackId.split('-').map(Number);
    updateFeedbackStatus(projectId, keyframeId, 'rejected');
    toast({
      title: "❌ Feedback Rejeitado",
      description: "Feedback marcado como rejeitado.",
    });
  };

  // Se um projeto audiovisual está selecionado, mostrar painel específico
  if (selectedAudiovisual) {
    const project = projects.find(p => p.id === selectedAudiovisual);
    const avInfo = audiovisualProjects[selectedAudiovisual];
    
    if (project && avInfo?.video_url) {
      return (
        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={() => setSelectedAudiovisual(null)}
            className="mb-4"
          >
            ← Voltar para lista de feedbacks
          </Button>
          
          <AudiovisualFeedbackPanel
            projectId={selectedAudiovisual}
            projectTitle={project.title}
            projectDescription={project.description}
            videoUrl={avInfo.video_url}
            shareId={avInfo.share_id}
            onStatusChange={(status) => {
              toast({
                title: "Status Atualizado",
                description: `Feedback marcado como ${status}`,
              });
            }}
          />
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header com métricas - Task 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Total</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">feedbacks</p>
                </div>
                <div className="p-2 bg-blue-500 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Pendentes</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">aguardando</p>
                </div>
                <div className="p-2 bg-amber-500 rounded-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Resolvidos</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.resolved}</p>
                  <p className="text-xs text-muted-foreground">concluídos</p>
                </div>
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Rejeitados</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                  <p className="text-xs text-muted-foreground">descartados</p>
                </div>
                <div className="p-2 bg-red-500 rounded-lg">
                  <XCircle className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Taxa Resposta</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.responseRate}%</p>
                  <p className="text-xs text-muted-foreground">respondidos</p>
                </div>
                <div className="p-2 bg-blue-500 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Tempo Médio</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.avgResponseTime}</p>
                  <p className="text-xs text-muted-foreground">resposta</p>
                </div>
                <div className="p-2 bg-purple-500 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filtros - Task 1 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar feedbacks, projetos ou autores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-48 h-11 bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-lg z-50">
                  <SelectItem value="all">Todos os Status ({allFeedbacks.length})</SelectItem>
                  <SelectItem value="pending">Pendente ({stats.pending})</SelectItem>
                  <SelectItem value="resolved">Resolvido ({stats.resolved})</SelectItem>
                  <SelectItem value="rejected">Rejeitado ({stats.rejected})</SelectItem>
                </SelectContent>
              </Select>

              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-full lg:w-64 h-11 bg-background">
                  <SelectValue placeholder="Projeto" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-lg z-50">
                  <SelectItem value="all">Todos os Projetos ({uniqueProjects.length})</SelectItem>
                  {uniqueProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtros ativos */}
            {(statusFilter !== 'all' || projectFilter !== 'all' || searchTerm) && (
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground">Filtros ativos:</span>
                {statusFilter !== 'all' && (
                  <Badge className={`${getStatusConfig(statusFilter).color} border`}>
                    Status: {getStatusConfig(statusFilter).label}
                    <button 
                      onClick={() => setStatusFilter('all')}
                      className="ml-1 hover:bg-black hover:bg-opacity-20 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {projectFilter !== 'all' && (
                  <Badge variant="secondary">
                    Projeto: {uniqueProjects.find(p => p.id.toString() === projectFilter)?.title}
                    <button 
                      onClick={() => setProjectFilter('all')}
                      className="ml-1 hover:bg-black hover:bg-opacity-20 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {searchTerm && (
                  <Badge variant="outline">
                    Busca: "{searchTerm}"
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="ml-1 hover:bg-black hover:bg-opacity-20 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Lista de Feedbacks */}
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {filteredFeedbacks.length > 0 ? (
            <motion.div
              key="feedbacks-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {filteredFeedbacks.map((feedback, index) => {
                const statusConfig = getStatusConfig(feedback.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <motion.div
                    key={feedback.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-md transition-all duration-300 border-0 shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              {/* Se é projeto audiovisual, abrir painel específico */}
                              {audiovisualProjects[feedback.projectId] ? (
                                <Button 
                                  variant="link" 
                                  className="p-0 h-auto font-semibold text-primary hover:underline text-left flex items-center gap-2"
                                  onClick={() => setSelectedAudiovisual(feedback.projectId)}
                                >
                                  <Video className="w-4 h-4" />
                                  {feedback.projectTitle}
                                </Button>
                              ) : (
                                <Button 
                                  variant="link" 
                                  className="p-0 h-auto font-semibold text-primary hover:underline text-left"
                                  onClick={() => handleViewProject(feedback.shareId, feedback.time)}
                                >
                                  {feedback.projectTitle}
                                </Button>
                              )}
                              {feedback.time > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {formatTime(feedback.time)}
                                </Badge>
                              )}
                              {feedback.priority && (
                                <Badge className={`text-xs ${
                                  feedback.priority === 'high' ? 'bg-red-100 text-red-800' :
                                  feedback.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {feedback.priority === 'high' ? 'Alta' : 
                                   feedback.priority === 'medium' ? 'Média' : 'Baixa'}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>{feedback.author}</span>
                              </div>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(feedback.timestamp).toLocaleString('pt-BR')}</span>
                              </div>
                              {feedback.department && (
                                <>
                                  <span>•</span>
                                  <span>{feedback.department}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>{feedback.type}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge className={`${statusConfig.color} border`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-blue-500">
                          <p className="text-foreground leading-relaxed">
                            {feedback.comment}
                          </p>
                        </div>

                        {/* Task 3: Exibir resposta se existir */}
                        {feedback.response && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-lg border-l-4 border-emerald-500"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Reply className="h-4 w-4 text-emerald-600" />
                              <span className="text-sm font-medium text-emerald-800">Resposta da Equipe</span>
                              {feedback.responseDate && (
                                <span className="text-xs text-emerald-600">
                                  • {new Date(feedback.responseDate).toLocaleString('pt-BR')}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-emerald-800 leading-relaxed">
                              {feedback.response}
                            </p>
                          </motion.div>
                        )}

                        {/* Task 3: Sistema de respostas */}
                        {feedback.status === 'pending' && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setRespondingTo(respondingTo === feedback.id ? null : feedback.id)}
                            >
                              <Reply className="h-4 w-4 mr-2" />
                              {respondingTo === feedback.id ? "Cancelar Resposta" : "Responder"}
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Ações
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-popover border shadow-lg z-50">
                                <DropdownMenuItem 
                                  onClick={() => markAsResolved(feedback.id)}
                                  className="cursor-pointer"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Marcar como Resolvido
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => markAsRejected(feedback.id)}
                                  className="cursor-pointer text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Marcar como Rejeitado
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            
                            <Button 
                              size="sm" 
                              onClick={() => handleViewProject(feedback.shareId, feedback.time)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver no Projeto
                            </Button>
                          </div>
                        )}

                        {/* Task 3: Campo de resposta */}
                        <AnimatePresence>
                          {respondingTo === feedback.id && (
                             <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="space-y-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border-l-4 border-orange-500"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="h-4 w-4 text-orange-600" />
                                <span className="text-sm font-medium text-orange-800">Sua Resposta</span>
                              </div>
                              <Textarea
                                placeholder="Digite sua resposta detalhada ao feedback..."
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                rows={4}
                                className="resize-none border-orange-200 focus:border-orange-400"
                              />
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleResponse(feedback.id)}
                                  disabled={!responseText.trim()}
                                  className="bg-orange-500 hover:bg-orange-600 text-white"
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Enviar Resposta
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setRespondingTo(null);
                                    setResponseText('');
                                  }}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="border-0 shadow-md">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Nenhum feedback encontrado
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      {searchTerm || statusFilter !== 'all' || projectFilter !== 'all'
                        ? "Tente ajustar os filtros para encontrar feedbacks."
                        : "Ainda não há feedbacks nos projetos. Os comentários aparecerão aqui quando forem adicionados aos projetos."
                      }
                    </p>
                    {(searchTerm || statusFilter !== 'all' || projectFilter !== 'all') && (
                      <Button
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                          setProjectFilter('all');
                        }}
                        variant="outline"
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Limpar Filtros
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FeedbackList;