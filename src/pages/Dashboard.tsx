import { useState, useEffect } from "react";
import { motion } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  TrendingDown,
  FileText,
  FolderOpen,
  AlertTriangle,
  Film,
  ClipboardList,
  Users,
  Zap,
  Star
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/MetricCard";
import { useProjects } from "@/contexts/ProjectContext";
import NewProjectModal from "@/components/NewProjectModal";
import NewAudiovisualProjectModal from "@/components/NewAudiovisualProjectModal";
import NewBriefingModal from "@/components/NewBriefingModal";

// ... keep existing code (imports)

const ProjectCard = ({ project, index }: any) => {
  const statusConfig = {
    pending: { 
      color: 'status-pending', 
      icon: Clock, 
      text: 'Pendente' 
    },
    approved: { 
      color: 'status-approved', 
      icon: CheckCircle, 
      text: 'Aprovado' 
    },
    rejected: { 
      color: 'status-rejected', 
      icon: XCircle, 
      text: 'Revisar' 
    },
    'feedback-sent': {
      color: 'status-feedback-sent',
      icon: AlertTriangle,
      text: 'Feedback Enviado'
    },
    'in-progress': {
      color: 'bg-blue-100 text-blue-800',
      icon: Zap,
      text: 'Em Progresso'
    },
    'archived': {
      color: 'bg-muted text-muted-foreground',
      icon: FolderOpen,
      text: 'Arquivado'
    },
    default: {
      color: 'status-unknown',
      icon: AlertTriangle,
      text: 'Desconhecido'
    }
  };

  const config = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.default;
  const StatusIcon = config.icon;

  const priorityColors = {
    low: 'bg-gray-200',
    medium: 'bg-yellow-400',
    high: 'bg-orange-500',
    urgent: 'bg-red-500'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="project-card card-hover bg-card border border-border rounded-xl p-6 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {/* Client name - most prominent */}
          <h2 className="text-lg font-bold text-foreground mb-1">
            {project.client}
          </h2>
          
          {/* Project title - secondary prominence */}
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="font-semibold text-foreground/90">{project.title}</h3>
            <div className={`w-2 h-2 rounded-full ${priorityColors[project.priority as keyof typeof priorityColors]}`}></div>
          </div>
          
          {/* Description - less prominent */}
          {project.description && (
            <p className="text-sm text-muted-foreground/80 mb-3 line-clamp-2">
              {project.description}
            </p>
          )}
          
          {/* Creator and link generation info */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Criado por {project.author || 'Usuário'}</span>
            <span>•</span>
            <span>Link gerado em {new Date(project.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit', 
              year: 'numeric'
            })}</span>
          </div>

        </div>

        <div className={`px-3 py-1 rounded-full flex items-center space-x-1 ${config.color}`}>
          <StatusIcon className="w-3 h-3" />
          <span className="text-xs font-medium">{config.text}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
            {project.type}
          </span>
          {project.tags && project.tags.slice(0, 2).map((tag: string) => (
            <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>

      </div>
    </motion.div>
  );
};

export default function Dashboard() {
  const { projects, getProjectStats, addProject } = useProjects();
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isAudiovisualModalOpen, setIsAudiovisualModalOpen] = useState(false);
  const [isBriefingModalOpen, setIsBriefingModalOpen] = useState(false);
  const stats = getProjectStats();

  const recentProjects = projects.slice(0, 3);

  // Enhanced metrics with better calculations
  const enhancedStats = {
    ...stats,
    completionRate: (stats.approved / stats.total) * 100 || 0,
    activeProjects: stats.pending + stats.inProgress,
    
    // Mock some advanced metrics (in real app, these would come from analytics)
    monthlyGrowth: {
      projects: 15,
      satisfaction: 3
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Dashboard" 
        subtitle="Visão geral dos projetos e atividades"
      />
      
      <main className="p-6 space-y-6">
        {/* Welcome Section with Logo on Right */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Bem-vindo! 🚀
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Gerencie e aprove conteúdos de forma eficiente com nossa plataforma moderna e intuitiva.
            </p>
          </div>
          
          <div className="hidden md:flex items-center justify-center ml-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 0.9, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              whileHover={{ 
                scale: 1.05, 
                rotate: 2,
                transition: { duration: 0.3 }
              }}
            >
              <Logo 
                className="h-32 w-auto opacity-90" 
                alt="MANUS I.A Logo" 
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Professional Metrics Grid - 4 Column Layout with Enhanced Visual Effects */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          <MetricCard
            title="Total de Projetos"
            value={stats.total}
            icon={FileText}
            iconGradient={['#8E44AD', '#7D3C98']}
            trend={enhancedStats.monthlyGrowth.projects}
            description="Todos os projetos este mês"
            index={0}
          />
          <MetricCard
            title="Projetos Pendentes"
            value={stats.pending}
            icon={Clock}
            iconGradient={['#E67E22', '#DC7633']}
            trend={5}
            description="Aguardando aprovação ou revisão"
            index={1}
          />
          <MetricCard
            title="Projetos Aprovados"
            value={stats.approved}
            icon={CheckCircle}
            iconGradient={['#27AE60', '#229954']}
            trend={8}
            description="Prontos para publicação"
            index={2}
          />
          <MetricCard
            title="Satisfação dos Clientes"
            value={stats.clientSatisfaction}
            icon={Star}
            iconGradient={['#E74C3C', '#C0392B']}
            trend={enhancedStats.monthlyGrowth.satisfaction}
            format="percentage"
            description="Avaliação média dos clientes"
            index={3}
          />
        </div>

        {/* Enhanced Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-6 shadow-lg"
        >
          <h2 className="text-xl font-bold text-foreground mb-6">Ações Rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary flex items-center justify-center space-x-2 py-4"
              onClick={() => setIsNewProjectModalOpen(true)}
            >
              <FileText className="w-5 h-5" />
              <span>Novo Projeto</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-outline-orange flex items-center justify-center space-x-2 py-4"
              onClick={() => setIsAudiovisualModalOpen(true)}
            >
              <Film className="w-5 h-5" />
              <span>Audiovisual</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-outline-orange flex items-center justify-center space-x-2 py-4"
              onClick={() => setIsBriefingModalOpen(true)}
            >
              <ClipboardList className="w-5 h-5" />
              <span>Briefing</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-outline-orange flex items-center justify-center space-x-2 py-4"
            >
              <Clock className="w-5 h-5" />
              <span>Ver Pendentes</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-outline-orange flex items-center justify-center space-x-2 py-4"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Ver Aprovados</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Enhanced Recent Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card border border-border rounded-2xl p-6 shadow-lg"
        >
          <h2 className="text-xl font-bold text-foreground mb-6">Projetos Recentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentProjects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
          
          {recentProjects.length === 0 && (
            <div className="text-center py-12">
              <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum projeto encontrado</h3>
              <p className="text-muted-foreground mb-6">Comece criando seu primeiro projeto.</p>
              <Button className="btn-primary">
                <FileText className="w-4 h-4 mr-2" />
                Criar Projeto
              </Button>
            </div>
          )}
        </motion.div>
      </main>

      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        setIsOpen={setIsNewProjectModalOpen}
        onProjectCreate={addProject}
      />
      
      <NewAudiovisualProjectModal
        isOpen={isAudiovisualModalOpen}
        setIsOpen={setIsAudiovisualModalOpen}
        onProjectCreate={addProject}
      />
      
      <NewBriefingModal
        isOpen={isBriefingModalOpen}
        setIsOpen={setIsBriefingModalOpen}
        onBriefingCreate={addProject}
      />
    </div>
  );
}