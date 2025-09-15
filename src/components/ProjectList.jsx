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
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ProjectViewerModal from '@/components/ProjectViewerModal';

const ProjectList = ({ projects, onProjectAction, onNewProjectClick, setActiveTab }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [viewingProject, setViewingProject] = useState(null);
  const { toast } = useToast();

  const filters = [
    { id: 'all', label: 'Todos', count: projects.length },
    { id: 'pending', label: 'Pendentes', count: projects.filter(p => p.status === 'pending' || p.status === 'rejected').length },
    { id: 'approved', label: 'Aprovados', count: projects.filter(p => p.status === 'approved').length },
  ];

  const filteredProjects = projects.filter(project => {
    const matchesFilter = activeFilter === 'all' || 
                         (activeFilter === 'pending' && (project.status === 'pending' || project.status === 'rejected')) ||
                         (activeFilter === 'approved' && project.status === 'approved');
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.author && project.author.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleAdjustProject = (projectId) => {
    toast({
      title: "🚧 Ajustar projeto não implementado ainda—mas não se preocupe! Você pode solicitar isso no seu próximo prompt! 🚀",
      description: "Isso abrirá a visão detalhada do projeto para edição.",
      duration: 4000,
    });
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
    toast({
      title: "🚧 Comentários não implementados ainda—mas não se preocupe! Você pode solicitar isso no seu próximo prompt! 🚀",
      duration: 4000,
    });
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
      low: { color: 'priority-low', label: 'Baixa', dot: 'bg-blue-500' },
      default: { color: 'priority-low', label: 'Não definida', dot: 'bg-gray-400' }
    };

    const config = statusConfig[project.status] || statusConfig.default;
    const priority = priorityConfig[project.priority] || priorityConfig.default;
    const StatusIcon = config.icon;

    const isRejectedOrSent = project.sharedAt || project.status === 'rejected';
    const isDownloading = downloadingId === project.id;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`project-card card-hover ${config.bgColor} ${config.borderColor}`}
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
          <span className="text-xs bg-white bg-opacity-70 text-gray-700 px-3 py-1 rounded-full border">
            {project.type}
          </span>
          <span className={`text-xs px-3 py-1 rounded-full ${priority.color}`}>
            Prioridade {priority.label}
          </span>
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
                onClick={() => setViewingProject(project)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>Ver Online</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDownload(project)}
                disabled={isDownloading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 disabled:bg-green-300"
              >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>{isDownloading ? 'Baixando...' : 'Baixar PDF'}</span>
              </motion.button>
              
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

        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <motion.button
              key={filter.id}
              id={`filter-${filter.id}`}
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
    </div>
  );
};

export default ProjectList;