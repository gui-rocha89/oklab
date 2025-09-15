import { useState, useEffect } from "react";
import { motion } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  FileText,
  FolderOpen,
  AlertTriangle,
  Film
} from 'lucide-react';
import logoWhite from '@/assets/logo-white-bg.png';
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock data structure for the platform
const mockProjects = [
  {
    id: 1,
    shareId: "abc123",
    title: "Campanha Verão 2024",
    description: "Vídeo promocional para a campanha de verão",
    status: "pending",
    priority: "high",
    author: "Maria Silva",
    createdAt: "2024-01-15T10:00:00Z",
    type: "Vídeo",
    keyframes: [
      { id: 1, time: 15.5, comment: "Ajustar cor do texto", timestamp: "2024-01-15T11:30:00Z" },
      { id: 2, time: 32.2, comment: "Logo muito pequena aqui", timestamp: "2024-01-15T14:20:00Z" }
    ]
  },
  {
    id: 2,
    shareId: "def456",
    title: "Tutorial Produto X",
    description: "Vídeo explicativo do novo produto",
    status: "approved",
    priority: "medium",
    author: "João Santos",
    createdAt: "2024-01-14T09:00:00Z",
    type: "Audiovisual",
    keyframes: []
  },
  {
    id: 3,
    shareId: "ghi789",
    title: "Apresentação Trimestral",
    description: "Slides para apresentação aos investidores",
    status: "feedback-sent",
    priority: "high",
    author: "Ana Costa",
    createdAt: "2024-01-13T16:00:00Z",
    type: "Design",
    keyframes: [
      { id: 3, time: 45.1, comment: "Gráfico precisa de mais destaque", timestamp: "2024-01-14T08:15:00Z" }
    ]
  }
];

const StatCard = ({ title, value, icon: Icon, color, trend, description }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4 }}
    className="stats-card hover-lift"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center">
        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
        <span className="text-sm text-green-600 font-medium">{trend}</span>
        <span className="text-sm text-gray-500 ml-1">vs. mês anterior</span>
      </div>
    )}
  </motion.div>
);

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
    default: {
      color: 'status-unknown',
      icon: AlertTriangle,
      text: 'Desconhecido'
    }
  };

  const config = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.default;
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="project-card card-hover"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{project.title}</h3>
          <p className="text-sm text-gray-600 mb-2">{project.description}</p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>Por {project.author}</span>
            <span>{new Date(project.createdAt).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full flex items-center space-x-1 ${config.color}`}>
          <StatusIcon className="w-3 h-3" />
          <span className="text-xs font-medium">{config.text}</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
          {project.type}
        </span>
        <div className={`w-2 h-2 rounded-full priority-${project.priority}`}></div>
      </div>
    </motion.div>
  );
};

export default function Dashboard() {
  const [projects] = useState(mockProjects);

  // Calculate statistics
  const stats = {
    total: projects.length,
    pending: projects.filter(p => p.status === "pending" || p.status === 'rejected').length,
    approved: projects.filter(p => p.status === "approved").length,
    feedbacks: projects.reduce((acc, p) => acc + p.keyframes.length, 0),
  };

  const recentProjects = projects.slice(0, 3);

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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Pendentes"
            value={stats.pending}
            icon={Clock}
            color="bg-gradient-to-r from-yellow-500 to-orange-500"
            trend="+12%"
            description="Aguardando aprovação ou revisão"
          />
          <StatCard
            title="Aprovados"
            value={stats.approved}
            icon={CheckCircle}
            color="bg-gradient-to-r from-green-500 to-emerald-500"
            trend="+8%"
            description="Prontos para publicação"
          />
          <StatCard
            title="Total"
            value={stats.total}
            icon={FileText}
            color="bg-gradient-to-r from-blue-500 to-purple-500"
            trend="+15%"
            description="Projetos este mês"
          />
          <StatCard
            title="Feedbacks"
            value={stats.feedbacks}
            icon={Film}
            color="bg-gradient-to-r from-purple-500 to-pink-500"
            trend="+20%"
            description="Comentários ativos"
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