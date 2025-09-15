import React from 'react';
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

const Dashboard = ({ projects, onNewProjectClick, onNewAudiovisualClick, setActiveTab }) => {
  const stats = {
    pending: projects.filter(p => p.status === 'pending' || p.status === 'rejected').length,
    approved: projects.filter(p => p.status === 'approved').length,
    total: projects.length
  };

  const recentProjects = projects.slice(0, 3);

  const StatCard = ({ title, value, icon: Icon, color, trend, description }) => (
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

  const ProjectCard = ({ project, index }) => {
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
      default: {
        color: 'status-unknown',
        icon: AlertTriangle,
        text: 'Desconhecido'
      }
    };

    const config = statusConfig[project.status] || statusConfig.default;
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

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Bem-vindo ao OK LAB! 🚀
        </h1>
        <p className="text-base sm:text-lg text-gray-600">
          Gerencie e aprove conteúdos de forma eficiente com nossa plataforma moderna e intuitiva.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            onClick={onNewProjectClick}
          >
            <FileText className="w-5 h-5" />
            <span>Novo Projeto</span>
          </motion.button>
           <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-outline-orange flex items-center justify-center space-x-2 py-4"
            onClick={onNewAudiovisualClick}
          >
            <Film className="w-5 h-5" />
            <span>Audiovisual</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setActiveTab('projects');
              setTimeout(() => document.querySelector('#filter-pending')?.click(), 50);
            }}
            className="btn-outline-orange flex items-center justify-center space-x-2 py-4"
          >
            <Clock className="w-5 h-5" />
            <span>Ver Pendentes</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setActiveTab('projects');
              setTimeout(() => document.querySelector('#filter-approved')?.click(), 50);
            }}
            className="btn-outline-orange flex items-center justify-center space-x-2 py-4"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Ver Aprovados</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Feedbacks Recebidos */}
      {(() => {
        const projectsWithFeedback = projects.filter(p => p.status === 'rejected' && p.keyframes && p.keyframes.length > 0);
        if (projectsWithFeedback.length === 0) return null;
        
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 shadow-lg border border-red-200"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Feedbacks Recebidos</h2>
                  <p className="text-sm text-gray-600">Projetos que precisam de correções</p>
                </div>
              </div>
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {projectsWithFeedback.length} {projectsWithFeedback.length === 1 ? 'projeto' : 'projetos'}
              </span>
            </div>
            
            <div className="space-y-4">
              {projectsWithFeedback.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-4 border border-red-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{project.title}</h3>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                          {project.keyframes.length} {project.keyframes.length === 1 ? 'comentário' : 'comentários'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                      
                      {/* Keyframes/Comentários */}
                      <div className="space-y-2">
                        {project.keyframes.slice(0, 2).map((keyframe, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-3 border-l-4 border-orange-400">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-orange-600">
                                {Math.floor(keyframe.time / 60)}:{(keyframe.time % 60).toFixed(0).padStart(2, '0')}
                              </span>
                              <span className="text-xs text-gray-500">Comentário do cliente</span>
                            </div>
                            <p className="text-sm text-gray-700">{keyframe.comment}</p>
                          </div>
                        ))}
                        {project.keyframes.length > 2 && (
                          <p className="text-xs text-gray-500 text-center">
                            +{project.keyframes.length - 2} comentários adicionais
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4 flex flex-col space-y-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => window.open(project.link, '_blank')}
                        className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full hover:bg-orange-200 transition-colors"
                      >
                        Ver Projeto
                      </motion.button>
                      <span className="text-xs text-gray-500 text-center">
                        {project.author} • {project.createdAt}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
      })()}

      {/* Recent Projects */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Projetos Recentes</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => setActiveTab('projects')}
            className="text-orange-600 hover:text-orange-700 font-medium text-sm"
          >
            Ver todos →
          </motion.button>
        </div>
        
        {recentProjects.length > 0 ? (
          <div className="space-y-4">
            {recentProjects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FolderOpen className="w-12 h-12 text-orange-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum projeto encontrado
            </h3>
            <p className="text-gray-600">
              Comece criando seu primeiro projeto para aprovação.
            </p>
          </div>
        )}
      </motion.div>

      {/* Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6">Atividade Recente</h2>
        <div className="space-y-4">
          {[
            { action: 'Projeto aprovado', project: 'Campanha Verão 2024', time: '2 horas atrás', type: 'success' },
            { action: 'Novo projeto criado', project: 'Banner Website', time: '4 horas atrás', type: 'info' },
            { action: 'Projeto para revisão', project: 'Post Redes Sociais', time: '1 dia atrás', type: 'warning' }
          ].map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className={`w-2 h-2 rounded-full ${
                activity.type === 'success' ? 'bg-green-500' :
                activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
              }`}></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {activity.action}: <span className="text-orange-600">{activity.project}</span>
                </p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;