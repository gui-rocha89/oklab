import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Filter, Grid, List, Plus, Eye, Edit, Trash2, ChevronDown, MessageSquare, Video, CheckCircle2, Link } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { useProjects } from "@/contexts/ProjectContext";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

// ... keep existing code (imports)

export default function Projects() {
  const { projects, updateProject, deleteProject } = useProjects();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const navigate = useNavigate();

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "approved": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "pending": return "bg-amber-100 text-amber-800 border-amber-200";
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      case "feedback-sent": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "approved": return "Aprovado";
      case "pending": return "Pendente";
      case "rejected": return "Rejeitado";
      case "feedback-sent": return "Feedback Enviado";
      default: return status;
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case "high": 
      case "urgent": 
        return "bg-red-100 text-red-800 border-red-300 hover:bg-red-200";
      case "medium": 
        return "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200";
      case "low": 
        return "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200";
      default: 
        return "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200";
    }
  };

  const getPriorityText = (priority: string): string => {
    switch (priority) {
      case "high": return "Alta";
      case "medium": return "Média";
      case "low": return "Baixa";
      case "urgent": return "Urgente";
      default: return "Não definida";
    }
  };

  const getPriorityIcon = (priority: string): string => {
    switch (priority) {
      case "high": return "🔴";
      case "urgent": return "⚠️";
      case "medium": return "🟡";
      case "low": return "🟢";
      default: return "⚪";
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         project.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || project.priority === priorityFilter;
    const matchesType = typeFilter === "all" || project.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  // Get unique project types for filter
  const uniqueTypes = [...new Set(projects.map(p => p.type))];

  // Stats for filter badges
  const getFilterCount = (filter: string, type: 'status' | 'priority' | 'type') => {
    if (filter === "all") return projects.length;
    return projects.filter(p => {
      if (type === 'status') return p.status === filter;
      if (type === 'priority') return p.priority === filter;
      if (type === 'type') return p.type === filter;
      return false;
    }).length;
  };

  const handleViewProject = (project: any) => {
    // Audiovisual projects go to client return page, others go to feedbacks
    if (project.type === 'Audiovisual') {
      navigate(`/retorno-cliente/${project.id}`);
    } else {
      navigate(`/feedbacks?projectId=${project.id}`);
    }
  };

  const handleEditProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      window.open(`/projeto/${project.share_id}`, '_blank');
    }
  };

  const handleDeleteProject = (projectId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este projeto?")) {
      deleteProject(projectId);
      toast({
        title: "Projeto Excluído",
        description: "O projeto foi removido com sucesso.",
        variant: "destructive",
      });
    }
  };

  const handleCopyClientLink = (project: any) => {
    if (!project.share_id) {
      toast({
        title: "Erro",
        description: "Este projeto não possui um link de cliente gerado.",
        variant: "destructive",
      });
      return;
    }

    const clientLink = `${window.location.origin}/aprovacao-audiovisual/${project.share_id}`;
    
    navigator.clipboard.writeText(clientLink).then(() => {
      toast({
        title: "Link copiado!",
        description: "Você pode enviar este link para o cliente.",
      });
    }).catch(() => {
      toast({
        title: "Erro ao copiar",
        description: "Tente copiar o link manualmente.",
        variant: "destructive",
      });
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Projetos" 
        subtitle="Gerencie todos os seus projetos em um só lugar"
      />
      
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Enhanced Filtros e Busca */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full lg:w-auto">
              {/* Enhanced Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por título, descrição, criado por ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 shadow-sm border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-44 h-11 bg-background shadow-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-lg z-50">
                    <SelectItem value="all">Todos ({getFilterCount("all", "status")})</SelectItem>
                    <SelectItem value="pending">Pendente ({getFilterCount("pending", "status")})</SelectItem>
                    <SelectItem value="approved">Aprovado ({getFilterCount("approved", "status")})</SelectItem>
                    <SelectItem value="in-progress">Em Progresso ({getFilterCount("in-progress", "status")})</SelectItem>
                    <SelectItem value="rejected">Rejeitado ({getFilterCount("rejected", "status")})</SelectItem>
                    <SelectItem value="feedback-sent">Feedback Enviado ({getFilterCount("feedback-sent", "status")})</SelectItem>
                  </SelectContent>
                </Select>

                {/* Enhanced Priority Filter with Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full sm:w-44 h-11 px-3 rounded-md justify-between bg-background shadow-sm hover:bg-muted hover:text-foreground hover:border-border transition-all duration-200 truncate text-ellipsis whitespace-nowrap overflow-hidden"
                      data-filter="priority"
                    >
                      <span className="flex items-center space-x-2 truncate">
                        <span>{getPriorityIcon(priorityFilter)}</span>
                        <span className="truncate">
                          {priorityFilter === "all" 
                            ? "Todas as Prioridades" 
                            : getPriorityText(priorityFilter)
                          }
                        </span>
                      </span>
                      <ChevronDown className="h-4 w-4 flex-shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-popover border shadow-lg z-50">
                    <DropdownMenuItem 
                      onClick={() => setPriorityFilter("all")}
                      className="flex items-center justify-between cursor-pointer hover:bg-muted"
                    >
                      <span className="flex items-center space-x-2">
                        <span>📋</span>
                        <span>Todas as Prioridades</span>
                      </span>
                      <Badge variant="secondary" className="ml-2">
                        {getFilterCount("all", "priority")}
                      </Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setPriorityFilter("urgent")}
                      className="flex items-center justify-between cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <span className="flex items-center space-x-2">
                        <span>⚠️</span>
                        <span>Urgente</span>
                      </span>
                      <Badge className="bg-red-100 text-red-800">
                        {getFilterCount("urgent", "priority")}
                      </Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setPriorityFilter("high")}
                      className="flex items-center justify-between cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <span className="flex items-center space-x-2">
                        <span>🔴</span>
                        <span>Alta</span>
                      </span>
                      <Badge className="bg-red-100 text-red-800">
                        {getFilterCount("high", "priority")}
                      </Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setPriorityFilter("medium")}
                      className="flex items-center justify-between cursor-pointer hover:bg-yellow-50 dark:hover:bg-yellow-950/20"
                    >
                      <span className="flex items-center space-x-2">
                        <span>🟡</span>
                        <span>Média</span>
                      </span>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {getFilterCount("medium", "priority")}
                      </Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setPriorityFilter("low")}
                      className="flex items-center justify-between cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                    >
                      <span className="flex items-center space-x-2">
                        <span>🟢</span>
                        <span>Baixa</span>
                      </span>
                      <Badge className="bg-emerald-100 text-emerald-800">
                        {getFilterCount("low", "priority")}
                      </Badge>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Type Filter */}
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-40 h-11 bg-background shadow-sm">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-lg z-50">
                    <SelectItem value="all">Todos os Tipos ({getFilterCount("all", "type")})</SelectItem>
                    {uniqueTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type} ({getFilterCount(type, "type")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className="h-11 w-11"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
                className="h-11 w-11"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button className="ml-2 h-11">
                <Plus className="h-4 w-4 mr-2" />
                Novo Projeto
              </Button>
            </div>
          </div>

          {/* Active Filters Display */}
          {(priorityFilter !== "all" || statusFilter !== "all" || typeFilter !== "all" || searchTerm) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex flex-wrap items-center gap-2 pb-2 border-b border-border"
            >
              <span className="text-sm text-muted-foreground">Filtros ativos:</span>
              {searchTerm && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Busca: "{searchTerm}"
                  <button 
                    onClick={() => setSearchTerm("")} 
                    className="ml-1 hover:bg-blue-200 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary" className={getStatusColor(statusFilter)}>
                  Status: {getStatusText(statusFilter)}
                  <button 
                    onClick={() => setStatusFilter("all")} 
                    className="ml-1 hover:bg-opacity-70 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {priorityFilter !== "all" && (
                <Badge variant="secondary" className={getPriorityColor(priorityFilter)}>
                  {getPriorityIcon(priorityFilter)} {getPriorityText(priorityFilter)}
                  <button 
                    onClick={() => setPriorityFilter("all")} 
                    className="ml-1 hover:bg-opacity-70 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {typeFilter !== "all" && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  Tipo: {typeFilter}
                  <button 
                    onClick={() => setTypeFilter("all")} 
                    className="ml-1 hover:bg-purple-200 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </motion.div>
          )}
        </div>

        {/* Lista/Grid de Projetos */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 items-stretch">
            {filteredProjects.map((project) => {
              const isAudiovisual = project.type === 'Audiovisual';
              
              const handleCardClick = (e: React.MouseEvent) => {
                // Não abrir link se clicar em botões
                if ((e.target as HTMLElement).closest('button')) {
                  return;
                }
                
                // Abrir link do projeto para o cliente
                if (project.share_id) {
                  const clientLink = `${window.location.origin}/aprovacao-audiovisual/${project.share_id}`;
                  window.open(clientLink, '_blank');
                }
              };
              
              return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex"
              >
                <Card 
                  onClick={handleCardClick}
                  className="min-h-[220px] p-5 rounded-2xl shadow-lg border-0 bg-card hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group overflow-hidden flex-1 flex flex-col cursor-pointer"
                >
                  <CardHeader className="pb-3 relative flex-shrink-0">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                    
                    <div className="flex items-start justify-between mb-3 relative z-10">
                      <div className="flex-1">
                        {/* Client Name Label */}
                        <div className="mb-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">
                            Nome do Cliente
                          </p>
                          <p className="text-sm font-medium text-foreground/90">{project.client || 'Cliente não informado'}</p>
                        </div>
                        
                        {/* Project Title */}
                        <CardTitle className="text-lg font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                          {project.title}
                        </CardTitle>
                        
                        {/* Audiovisual Tag */}
                        {isAudiovisual && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs font-bold">
                              <Video className="w-3 h-3 mr-1" />
                              AUDIOVISUAL
                            </Badge>
                            {project.completed_at && (
                              <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 text-xs font-bold">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                RETORNO RECEBIDO
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Status & Priority Badges */}
                      <div className="flex flex-col items-end space-y-2 ml-3">
                        <Badge className={`${getStatusColor(project.status)} border-0 shadow-sm font-medium`}>
                          {getStatusText(project.status)}
                        </Badge>
                        <Badge className={`${getPriorityColor(project.priority)} border-0 shadow-sm font-medium`}>
                          <span className="flex items-center space-x-1">
                            <span>{getPriorityIcon(project.priority)}</span>
                            <span>{getPriorityText(project.priority)}</span>
                          </span>
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 flex-1 flex flex-col">
                    {/* Project Description */}
                    <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                    
                    {/* Meta Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                          Criado por:
                        </p>
                        <p className="text-sm font-medium text-foreground/90">{project.author || 'Usuário'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                          Criado em:
                        </p>
                        <p className="text-sm font-medium text-foreground/90">
                          {new Date(project.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto">
                      <div className="text-sm text-muted-foreground flex items-center space-x-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>
                          {project.keyframes?.reduce((total, keyframe) => 
                            total + (keyframe.feedbacks?.filter(feedback => feedback.status === 'pending').length || 0), 0
                          ) || 0} comentário(s) pendente(s)
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProject(project.id);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {isAudiovisual && project.share_id && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyClientLink(project);
                                  }}
                                >
                                  <Link className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copiar link para o cliente</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewProject(project);
                          }}
                          className={`ml-2 ${isAudiovisual ? 'bg-purple-600 hover:bg-purple-700' : 'bg-primary hover:bg-primary/90'} text-white shadow-md hover:shadow-lg transition-all`}
                        >
                          {isAudiovisual ? <MessageSquare className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                          {isAudiovisual ? 'Ver Retorno do Cliente' : 'Ver Projeto'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredProjects.map((project) => {
                  const isAudiovisual = project.type === 'Audiovisual';
                  
                  const handleCardClick = (e: React.MouseEvent) => {
                    // Não abrir link se clicar em botões
                    if ((e.target as HTMLElement).closest('button')) {
                      return;
                    }
                    
                    // Abrir link do projeto para o cliente
                    if (project.share_id) {
                      const clientLink = `${window.location.origin}/aprovacao-audiovisual/${project.share_id}`;
                      window.open(clientLink, '_blank');
                    }
                  };
                  
                  return (
                  <div 
                    key={project.id} 
                    onClick={handleCardClick}
                    className="p-6 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground truncate">
                            {project.title}
                          </h3>
                          {isAudiovisual && (
                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs font-bold">
                              <Video className="w-3 h-3 mr-1" />
                              AUDIOVISUAL
                            </Badge>
                          )}
                          <Badge className={getStatusColor(project.status)}>
                            {getStatusText(project.status)}
                          </Badge>
                          <Badge className={getPriorityColor(project.priority)}>
                            {project.priority === "high" ? "Alta" : project.priority === "medium" ? "Média" : "Baixa"}
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground text-sm mb-2 line-clamp-1">
                          {project.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{project.client}</span>
                          <span>{project.type}</span>
                          <span>{new Date(project.created_at).toLocaleDateString('pt-BR')}</span>
                          {(() => {
                            const pendingFeedbacks = project.keyframes?.reduce((total, keyframe) => 
                              total + (keyframe.feedbacks?.filter(feedback => feedback.status === 'pending').length || 0), 0
                            ) || 0;
                            return pendingFeedbacks > 0 && (
                              <span className="text-primary">
                                {pendingFeedbacks} comentário{pendingFeedbacks !== 1 ? 's' : ''}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewProject(project);
                          }}
                          className={isAudiovisual ? 'bg-purple-600 hover:bg-purple-700' : ''}
                        >
                          {isAudiovisual ? <MessageSquare className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                          {isAudiovisual ? 'Ver Retorno' : 'Ver Projeto'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProject(project.id);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {isAudiovisual && project.share_id && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyClientLink(project);
                                  }}
                                >
                                  <Link className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copiar link do cliente</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {filteredProjects.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum projeto encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Tente ajustar os filtros ou criar um novo projeto.
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Novo Projeto
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}