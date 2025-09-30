import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Search, 
  Clock, 
  CheckCircle, 
  XCircle,
  Download,
  MessageSquare,
  Calendar,
  User,
  FileText,
  FolderOpen,
  Edit,
  Link,
  RefreshCw,
  ArrowLeft,
  AlertTriangle,
  Loader2,
  Eye,
  Filter,
  ChevronDown,
  X,
  Video,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ProjectViewerModal from '@/components/ProjectViewerModal';
import CommentModal from '@/components/CommentModal';
import ProjectEditModal from '@/components/ProjectEditModal';

const ProjectList = ({ projects, onProjectAction, onNewProjectClick, setActiveTab }) => {
  // Task 1: Estados para filtros avançados
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [viewingProject, setViewingProject] = useState(null);
  const [commentingProject, setCommentingProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  
  // Novos estados para filtros avançados
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const { toast } = useToast();

  // Enhanced filters with counts
  const filters = [
    { id: 'all', label: 'Todos', count: projects.length },
    { id: 'pending', label: 'Pendentes', count: projects.filter(p => p.status === 'pending' || p.status === 'rejected').length },
    { id: 'approved', label: 'Aprovados', count: projects.filter(p => p.status === 'approved').length },
  ];

  // Status options for dropdown
  const statusOptions = [
    { value: 'all', label: 'Todos os Status', count: projects.length },
    { value: 'pending', label: 'Pendente', count: projects.filter(p => p.status === 'pending').length },
    { value: 'approved', label: 'Aprovado', count: projects.filter(p => p.status === 'approved').length },
    { value: 'rejected', label: 'Rejeitado', count: projects.filter(p => p.status === 'rejected').length },
    { value: 'feedback-sent', label: 'Feedback Enviado', count: projects.filter(p => p.status === 'feedback-sent').length },
  ];

  // Priority options for dropdown 
  const priorityOptions = [
    { value: 'all', label: 'Todas as Prioridades', count: projects.length, icon: '📋' },
    { value: 'urgent', label: 'Urgente', count: projects.filter(p => p.priority === 'urgent').length, icon: '⚠️' },
    { value: 'high', label: 'Alta', count: projects.filter(p => p.priority === 'high').length, icon: '🔴' },
    { value: 'medium', label: 'Média', count: projects.filter(p => p.priority === 'medium').length, icon: '🟡' },
    { value: 'low', label: 'Baixa', count: projects.filter(p => p.priority === 'low').length, icon: '🟢' },
  ];

  // Utility functions
  const getStatusConfig = (status) => {
    const configs = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Pendente' },
      approved: { color: 'bg-green-100 text-green-800 border-green-300', label: 'Aprovado' },
      rejected: { color: 'bg-red-100 text-red-800 border-red-300', label: 'Rejeitado' },
      'feedback-sent': { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Feedback Enviado' },
      default: { color: 'bg-gray-100 text-gray-600 border-gray-300', label: 'Desconhecido' }
    };
    return configs[status] || configs.default;
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      urgent: { color: 'bg-red-200 text-red-900 border-red-400', label: 'Urgente', icon: '⚠️' },
      high: { color: 'bg-red-100 text-red-800 border-red-300', label: 'Alta', icon: '🔴' },
      medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Média', icon: '🟡' },
      low: { color: 'bg-emerald-100 text-emerald-800 border-emerald-300', label: 'Baixa', icon: '🟢' },
      default: { color: 'bg-gray-100 text-gray-600 border-gray-300', label: 'Não definida', icon: '⚪' }
    };
    return configs[priority] || configs.default;
  };

  // Task 2: Lógica de filtragem avançada dos projetos
  const filteredProjects = projects.filter(project => {
    // Filtro básico (existente)
    const matchesBasicFilter = activeFilter === 'all' || 
                              (activeFilter === 'pending' && (project.status === 'pending' || project.status === 'rejected')) ||
                              (activeFilter === 'approved' && project.status === 'approved');
    
    // Filtro por busca
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.author && project.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filtros avançados
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
    
    return matchesBasicFilter && matchesSearch && matchesStatus && matchesPriority;
  });

  // Clear all filters function
  const clearAllFilters = () => {
    setActiveFilter('all');
    setStatusFilter('all');
    setPriorityFilter('all');
    setSearchTerm('');
  };

  // Check if any advanced filters are active
  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all' || searchTerm !== '';

  const handleAdjustProject = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setEditingProject(project);
    }
  };

  const handleDownload = async (project) => {
    setDownloadingId(project.id);
    toast({
      title: "Gerando PDF...",
      description: "Aguarde enquanto preparamos o seu download.",
    });

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;
      let yPos = margin;

      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(project.title, margin, yPos);
      yPos += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Status: ${project.status}`, margin, yPos);
      yPos += 5;
      doc.text(`Autor: ${project.author}`, margin, yPos);
      yPos += 5;
      doc.text(`Data de Criação: ${new Date(project.createdAt).toLocaleDateString('pt-BR')}`, margin, yPos);
      yPos += 10;

      for (const creative of project.creatives) {
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = margin;
        }
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(creative.name, margin, yPos);
        yPos += 8;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'italic');
        doc.text(creative.caption, margin, yPos, { maxWidth: contentWidth });
        yPos += 15;

        for (const attachment of creative.attachments) {
          if (attachment.url.endsWith('.mp4')) {
            doc.text('Vídeo (não incluído no PDF):', margin, yPos);
            yPos += 5;
            doc.setTextColor(0, 0, 255);
            doc.textWithLink(attachment.url, margin, yPos, { url: attachment.url });
            doc.setTextColor(0, 0, 0);
            yPos += 10;
          } else {
            try {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.src = attachment.url;
              await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
              });

              const canvas = await html2canvas(img, { useCORS: true });
              const imgData = canvas.toDataURL('image/jpeg', 0.8);
              const imgProps = doc.getImageProperties(imgData);
              const imgHeight = (imgProps.height * contentWidth) / imgProps.width;

              if (yPos + imgHeight > pageHeight - margin) {
                doc.addPage();
                yPos = margin;
              }
              doc.addImage(imgData, 'JPEG', margin, yPos, contentWidth, imgHeight);
              yPos += imgHeight + 10;
            } catch (e) {
              doc.text(`Erro ao carregar imagem: ${attachment.name}`, margin, yPos);
              yPos += 10;
            }
          }
        }
      }

      doc.save(`projeto-${project.title.replace(/\s/g, '_')}.pdf`);
      toast({
        title: "✅ Download Concluído!",
        description: "Seu PDF foi gerado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        variant: "destructive",
        title: "❌ Erro no Download",
        description: "Não foi possível gerar o PDF. Tente novamente.",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleComment = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCommentingProject(project);
    }
  };

  const handleSaveProject = (updatedProject) => {
    // Aqui você salvaria o projeto via API/Supabase
    onProjectAction(updatedProject.id, 'update', updatedProject);
    setEditingProject(null);
  };

  const ProjectCard = ({ project, index }) => {
    const statusConfig = {
      pending: { 
        color: 'status-pending', 
        icon: Clock, 
        text: 'Pendente',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      },
      approved: { 
        color: 'status-approved', 
        icon: CheckCircle, 
        text: 'Aprovado',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      rejected: { 
        color: 'status-rejected', 
        icon: XCircle, 
        text: 'Revisar',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      },
       default: {
        color: 'status-unknown',
        icon: AlertTriangle,
        text: 'Desconhecido',
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-300'
      }
    };

    const priorityConfig = {
      high: { color: 'priority-high', label: 'Alta', dot: 'bg-red-500' },
      medium: { color: 'priority-medium', label: 'Média', dot: 'bg-yellow-500' },
      low: { color: 'priority-low', label: 'Baixa', dot: 'bg-emerald-500' },
      urgent: { color: 'priority-urgent', label: 'Urgente', dot: 'bg-red-600 animate-pulse' },
      default: { color: 'priority-low', label: 'Não definida', dot: 'bg-gray-400' }
    };

    const config = statusConfig[project.status] || statusConfig.default;
    const priority = priorityConfig[project.priority] || priorityConfig.default;
    const StatusIcon = config.icon;

    const isRejectedOrSent = project.sharedAt || project.status === 'rejected';
    const isDownloading = downloadingId === project.id;
    const isAudiovisual = project.type === 'Audiovisual';
    
    const handleCardClick = (e) => {
      // Não abrir link se clicar em botões ou inputs
      if (e.target.closest('button') || e.target.closest('input')) {
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        onClick={handleCardClick}
        className={`project-card card-hover ${config.bgColor} ${config.borderColor} cursor-pointer`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-bold text-gray-900 text-lg">{project.title}</h3>
              <div className={`w-2 h-2 rounded-full ${priority.dot}`} title={`Prioridade ${priority.label}`}></div>
            </div>
            <p className="text-gray-600 mb-3">{project.description}</p>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span>{project.author}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(project.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <FileText className="w-4 h-4" />
                <span>{project.files} arquivo{project.files !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
          
          <div className={`px-3 py-1 rounded-full flex items-center space-x-1 ${config.color}`}>
            <StatusIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{config.text}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-4">
          {isAudiovisual ? (
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs font-bold flex items-center space-x-1">
              <Video className="w-3 h-3" />
              <span>AUDIOVISUAL</span>
            </Badge>
          ) : (
            <span className="text-xs bg-white bg-opacity-70 text-gray-700 px-3 py-1 rounded-full border">
              {project.type}
            </span>
          )}
          <Badge className={`${getPriorityConfig(project.priority).color} border text-xs font-medium`}>
            <span className="flex items-center space-x-1">
              <span>{getPriorityConfig(project.priority).icon}</span>
              <span>Prioridade {getPriorityConfig(project.priority).label}</span>
            </span>
          </Badge>
          <Badge className={`${getStatusConfig(project.status).color} border text-xs font-medium`}>
            {getStatusConfig(project.status).label}
          </Badge>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
             <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleComment(project.id)}
              className="p-2 rounded-lg hover:bg-white hover:bg-opacity-70 transition-colors tooltip"
              data-tooltip="Comentar"
            >
              <MessageSquare className="w-4 h-4 text-gray-600" />
            </motion.button>
          </div>

          {(project.status === 'pending' || project.status === 'rejected') ? (
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAdjustProject(project.id)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Ajustar</span>
              </motion.button>
              {isRejectedOrSent ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onProjectAction(project.id, 'resend')}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reenviar</span>
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onProjectAction(project.id, 'generateLink')}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Link className="w-4 h-4" />
                  <span>Gerar Link</span>
                </motion.button>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
               <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isAudiovisual) {
                    // Ver feedback na página de Feedbacks
                    setActiveTab('feedbacks');
                  } else {
                    setViewingProject(project);
                  }
                }}
                className={`px-4 py-2 ${isAudiovisual ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-700'} text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2`}
              >
                {isAudiovisual ? <MessageSquare className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{isAudiovisual ? 'Ver Feedback' : 'Ver Online'}</span>
              </motion.button>
              {!isAudiovisual && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(project);
                  }}
                  disabled={isDownloading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 disabled:bg-green-300"
                >
                  {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>{isDownloading ? 'Baixando...' : 'Baixar PDF'}</span>
                </motion.button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projetos</h1>
          <p className="text-gray-600">Gerencie e aprove conteúdos da sua equipe</p>
        </div>
        
        <div className="flex items-center space-x-4">
           <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('dashboard')}
            className="btn-secondary hidden sm:flex items-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Dashboard</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary"
            onClick={onNewProjectClick}
          >
            + Novo Projeto
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
      >
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por título, autor ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input w-full pl-10 pr-4"
          />
        </div>

        {/* Enhanced Filter Section */}
        <div className="space-y-4 mb-6">
          {/* Basic Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => (
              <motion.button
                key={filter.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveFilter(filter.id)}
                className={`tab-button ${activeFilter === filter.id ? 'active' : ''}`}
              >
                {filter.label}
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  activeFilter === filter.id 
                    ? 'bg-white bg-opacity-30' 
                    : 'bg-gray-100'
                }`}>
                  {filter.count}
                </span>
              </motion.button>
            ))}

            {/* Advanced Filters Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="ml-2 h-10"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros Avançados
              <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {/* Task 3: Dropdowns para filtros avançados */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg border"
              >
                {/* Status Filter Dropdown */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Status:</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="min-w-[160px] justify-between bg-white">
                        <span className="flex items-center">
                          {statusFilter === 'all' ? 'Todos os Status' : getStatusConfig(statusFilter).label}
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-white border shadow-lg z-50">
                      {statusOptions.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => setStatusFilter(option.value)}
                          className="flex items-center justify-between cursor-pointer hover:bg-gray-50"
                        >
                          <span>{option.label}</span>
                          <Badge variant="secondary" className="ml-2">
                            {option.count}
                          </Badge>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Priority Filter Dropdown */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Prioridade:</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="min-w-[180px] justify-between bg-white">
                        <span className="flex items-center space-x-1">
                          <span>{priorityFilter !== 'all' ? getPriorityConfig(priorityFilter).icon : '📋'}</span>
                          <span>
                            {priorityFilter === 'all' ? 'Todas as Prioridades' : getPriorityConfig(priorityFilter).label}
                          </span>
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-white border shadow-lg z-50">
                      {priorityOptions.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => setPriorityFilter(option.value)}
                          className="flex items-center justify-between cursor-pointer hover:bg-gray-50"
                        >
                          <span className="flex items-center space-x-2">
                            <span>{option.icon}</span>
                            <span>{option.label}</span>
                          </span>
                          <Badge variant="secondary" className="ml-2">
                            {option.count}
                          </Badge>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Limpar Filtros
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-wrap items-center gap-2"
            >
              <span className="text-sm text-gray-500">Filtros ativos:</span>
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
              {priorityFilter !== 'all' && (
                <Badge className={`${getPriorityConfig(priorityFilter).color} border`}>
                  {getPriorityConfig(priorityFilter).icon} {getPriorityConfig(priorityFilter).label}
                  <button 
                    onClick={() => setPriorityFilter('all')}
                    className="ml-1 hover:bg-black hover:bg-opacity-20 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {filteredProjects.length > 0 ? (
          <motion.div
            key="projects-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {filteredProjects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="empty-state"
          >
            <FolderOpen className="w-16 h-16 text-orange-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum projeto encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? `Não encontramos projetos que correspondam a "${searchTerm}"`
                : `Não há projetos ${activeFilter === 'all' ? '' : filters.find(f => f.id === activeFilter)?.label.toLowerCase()} no momento`
              }
            </p>
            {searchTerm && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSearchTerm('')}
                className="btn-primary"
              >
                Limpar busca
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      <ProjectViewerModal 
        project={viewingProject}
        isOpen={!!viewingProject}
        onClose={() => setViewingProject(null)}
      />
      
      <CommentModal
        project={commentingProject}
        isOpen={!!commentingProject}
        onClose={() => setCommentingProject(null)}
      />
      
      <ProjectEditModal
        project={editingProject}
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        onSave={handleSaveProject}
      />
    </div>
  );
};

export default ProjectList;