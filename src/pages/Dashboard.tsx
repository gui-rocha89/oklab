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
  DollarSign,
  Target,
  Users,
  BarChart3,
  Zap,
  Star
} from 'lucide-react';
import logoWhite from '@/assets/logo-white-bg.png';
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/MetricCard";
import { useProjects } from "@/contexts/ProjectContext";

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
      color: 'bg-gray-100 text-gray-600',
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
      className="project-card card-hover bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="font-semibold text-gray-900">{project.title}</h3>
            <div className={`w-2 h-2 rounded-full ${priorityColors[project.priority as keyof typeof priorityColors]}`}></div>
          </div>
          <p className="text-sm text-gray-600 mb-3">{project.description}</p>
          
          {/* Project metadata */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-3">
            <span>Por {project.author}</span>
            <span>•</span>
            <span>{new Date(project.createdAt).toLocaleDateString('pt-BR')}</span>
            {project.client && (
              <>
                <span>•</span>
                <span className="font-medium">{project.client}</span>
              </>
            )}
          </div>

          {/* Enhanced project stats */}
          {project.budget && (
            <div className="flex items-center space-x-4 text-xs mb-2">
              <span className="flex items-center space-x-1">
                <DollarSign className="w-3 h-3" />
                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.budget)}</span>
              </span>
              {project.estimatedHours && (
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{project.estimatedHours}h est.</span>
                </span>
              )}
              {project.viewCount && (
                <span className="flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>{project.viewCount} views</span>
                </span>
              )}
            </div>
          )}
        </div>

        <div className={`px-3 py-1 rounded-full flex items-center space-x-1 ${config.color}`}>
          <StatusIcon className="w-3 h-3" />
          <span className="text-xs font-medium">{config.text}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            {project.type}
          </span>
          {project.tags && project.tags.slice(0, 2).map((tag: string) => (
            <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>

        {/* Performance indicator */}
        {project.vsLastMonth !== undefined && (
          <div className="flex items-center space-x-1">
            {project.vsLastMonth > 0 ? (
              <TrendingUp className="w-3 h-3 text-green-500" />
            ) : project.vsLastMonth < 0 ? (
              <TrendingDown className="w-3 h-3 text-red-500" />
            ) : null}
            <span className={`text-xs font-medium ${
              project.vsLastMonth > 0 ? 'text-green-600' : 
              project.vsLastMonth < 0 ? 'text-red-600' : 'text-gray-500'
            }`}>
              {project.vsLastMonth > 0 ? '+' : ''}{project.vsLastMonth}%
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default function Dashboard() {
  const { projects, getProjectStats } = useProjects();
  const stats = getProjectStats();

  const recentProjects = projects.slice(0, 3);

  // Enhanced metrics with better calculations
  const enhancedStats = {
    ...stats,
    // Calculate additional metrics for better insights
    avgProjectValue: stats.totalBudget / stats.total || 0,
    completionRate: (stats.approved / stats.total) * 100 || 0,
    activeProjects: stats.pending + stats.inProgress,
    
    // Mock some advanced metrics (in real app, these would come from analytics)
    monthlyGrowth: {
      projects: 15,
      revenue: 22,
      efficiency: 5,
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
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Bem-vindo! 🚀
            </h1>
            <p className="text-base sm:text-lg text-gray-600">
              Gerencie e aprove conteúdos de forma eficiente com nossa plataforma moderna e intuitiva.
            </p>
          </div>
          
          <div className="hidden md:flex items-center justify-center ml-8">
            <motion.img
              src={logoWhite}
              alt="MANUS I.A Logo"
              className="h-32 w-auto opacity-90"
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 0.9, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              whileHover={{ 
                scale: 1.05, 
                rotate: 2,
                transition: { duration: 0.3 }
              }}
            />
          </div>
        </motion.div>

        {/* Centralized Search Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <div className="w-full max-w-2xl">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <FileText className="w-5 h-5 text-primary" />
                </motion.div>
              </div>
              <input
                type="text"
                placeholder="Buscar projetos, equipe, feedbacks... 🔍"
                className="w-full pl-12 pr-6 py-4 text-lg bg-white border-2 border-gray-200 rounded-2xl shadow-lg hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 placeholder-gray-500"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded">
                  Ctrl+K
                </kbd>
              </div>
            </div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center text-sm text-gray-500 mt-2"
            >
              Encontre rapidamente qualquer projeto, membro da equipe ou feedback
            </motion.p>
          </div>
        </motion.div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Projetos Pendentes"
            value={stats.pending}
            icon={Clock}
            color="bg-gradient-to-br from-amber-500 to-orange-600"
            trend={enhancedStats.monthlyGrowth.projects}
            description="Aguardando aprovação ou revisão"
            index={0}
          />
          <MetricCard
            title="Projetos Aprovados"
            value={stats.approved}
            icon={CheckCircle}
            color="bg-gradient-to-br from-emerald-500 to-green-600"
            trend={8}
            description="Prontos para publicação"
            index={1}
          />
          <MetricCard
            title="Em Progresso"
            value={stats.inProgress}
            icon={Zap}
            color="bg-gradient-to-br from-blue-500 to-indigo-600"
            trend={25}
            description="Sendo desenvolvidos ativamente"
            index={2}
          />
          <MetricCard
            title="Total de Projetos"
            value={stats.total}
            icon={FileText}
            color="bg-gradient-to-br from-violet-500 to-purple-600"
            trend={enhancedStats.monthlyGrowth.projects}
            description="Todos os projetos este mês"
            index={3}
          />
        </div>

        {/* Advanced Business Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Receita Total"
            value={stats.totalBudget}
            icon={DollarSign}
            color="bg-gradient-to-br from-emerald-600 to-teal-600"
            trend={enhancedStats.monthlyGrowth.revenue}
            format="currency"
            description="Valor total dos projetos ativos"
            index={4}
          />
          <MetricCard
            title="Tempo de Aprovação"
            value={stats.avgApprovalTime}
            icon={Target}
            color="bg-gradient-to-br from-cyan-500 to-blue-600"
            trend={-15}
            format="time"
            description="Média de horas para aprovação"
            index={5}
          />
          <MetricCard
            title="Taxa de Eficiência"
            value={stats.efficiency}
            icon={BarChart3}
            color="bg-gradient-to-br from-indigo-500 to-purple-600"
            trend={enhancedStats.monthlyGrowth.efficiency}
            format="percentage"
            description="Projetos entregues no prazo"
            index={6}
          />
          <MetricCard
            title="Satisfação dos Clientes"
            value={stats.clientSatisfaction}
            icon={Star}
            color="bg-gradient-to-br from-rose-500 to-pink-600"
            trend={enhancedStats.monthlyGrowth.satisfaction}
            format="percentage"
            description="Avaliação média dos clientes"
            index={7}
          />
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Ações Rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary flex items-center justify-center space-x-2 py-4"
            >
              <FileText className="w-5 h-5" />
              <span>Novo Projeto</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-outline-orange flex items-center justify-center space-x-2 py-4"
            >
              <Film className="w-5 h-5" />
              <span>Audiovisual</span>
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

        {/* Recent Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Projetos Recentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentProjects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
          
          {recentProjects.length === 0 && (
            <div className="text-center py-12">
              <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum projeto encontrado</h3>
              <p className="text-gray-600 mb-6">Comece criando seu primeiro projeto.</p>
              <Button className="btn-primary">
                <FileText className="w-4 h-4 mr-2" />
                Criar Projeto
              </Button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}