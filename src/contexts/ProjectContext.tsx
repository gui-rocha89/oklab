import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Enhanced project interface with feedback support
export interface Project {
  id: string;
  share_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'feedback-sent' | 'in-progress' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  client: string;
  type: 'Vídeo' | 'Audiovisual' | 'Design' | 'Documento' | 'Apresentação';
  approval_date?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  author?: string;
  keyframes: Array<{
    id: string;
    title: string;
    feedback_count: number;
    status: 'pending' | 'approved' | 'rejected';
    attachments: any[];
    feedbacks: Array<{
      id: string;
      x_position: number;
      y_position: number;
      comment: string;
      response?: string;
      status: 'pending' | 'resolved' | 'rejected';
      created_at: string;
      updated_at: string;
      user_id: string;
    }>;
  }>;
}

interface ProjectContextType {
  projects: Project[];
  loading: boolean;
  addProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addFeedbackResponse: (projectId: string, keyframeId: string, response: string, author?: string) => Promise<void>;
  updateFeedbackStatus: (projectId: string, keyframeId: string, status: 'resolved' | 'pending' | 'rejected') => Promise<void>;
  getProjectStats: () => {
    total: number;
    pending: number;
    approved: number;
    inProgress: number;
    archived: number;
    feedbacks: number;
    clientSatisfaction: number;
  };
  filterByPriority: (priority: Project['priority']) => Project[];
  filterByStatus: (status: Project['status']) => Project[];
  sortByPriority: (projects?: Project[]) => Project[];
  getProjectsByClient: (client: string) => Project[];
  getOverdueProjects: () => Project[];
  getAllFeedbacks: () => Array<{
    id: string;
    feedbackId: string;
    projectId: string;
    projectTitle: string;
    shareId: string;
    comment: string;
    x_position: number;
    y_position: number;
    timestamp: string;
    status: 'resolved' | 'pending' | 'rejected';
    author: string;
    response?: string;
    priority: string;
    type: string;
  }>;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      // Fetch projects with keyframes and feedbacks
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          profiles!projects_user_id_fkey (
            full_name,
            email
          ),
          project_keyframes (
            *,
            project_feedback (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Transform data to match interface
      const transformedProjects: Project[] = (projectsData || []).map(project => ({
        ...project,
        author: project.profiles?.full_name || project.profiles?.email || 'Usuário',
        keyframes: (project.project_keyframes || []).map(kf => ({
          ...kf,
          feedbacks: kf.project_feedback || []
        }))
      }));

      setProjects(transformedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar projetos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const addProject = async (projectData: any) => {
    const timestamp = () => `[${new Date().toISOString()}]`;
    
    try {
      console.log('📝 [ProjectContext]', timestamp(), '====================================');
      console.log('📝 [ProjectContext]', timestamp(), 'INICIANDO INSERÇÃO NO BANCO DE DADOS');
      console.log('📝 [ProjectContext]', timestamp(), '====================================');
      console.log('📝 [ProjectContext]', timestamp(), 'Dados recebidos:', projectData);
      
      // Validar campos obrigatórios ANTES de processar
      console.log('🔍 [ProjectContext]', timestamp(), 'Validando campos obrigatórios...');
      
      if (!projectData.title || !projectData.title.trim()) {
        throw new Error('Campo obrigatório ausente: title');
      }
      if (!projectData.client || !projectData.client.trim()) {
        throw new Error('Campo obrigatório ausente: client');
      }
      if (!projectData.type) {
        throw new Error('Campo obrigatório ausente: type');
      }
      if (!projectData.user_id) {
        throw new Error('Campo obrigatório ausente: user_id');
      }
      if (!projectData.share_id) {
        throw new Error('Campo obrigatório ausente: share_id');
      }
      
      console.log('✅ [ProjectContext]', timestamp(), 'Todos os campos obrigatórios presentes');
      
      // Lista EXATA de campos válidos da tabela projects
      const validFields = ['title', 'client', 'description', 'type', 'status', 'priority', 'user_id', 'share_id', 'video_url', 'approval_date'];
      
      console.log('🧹 [ProjectContext]', timestamp(), 'Limpando dados - removendo campos inválidos...');
      console.log('🧹 [ProjectContext]', timestamp(), 'Campos recebidos ANTES da limpeza:', Object.keys(projectData));
      
      // VALIDAÇÃO EXTRA: Verificar se há campos inválidos
      const receivedFields = Object.keys(projectData);
      const invalidFields = receivedFields.filter(f => !validFields.includes(f));
      
      if (invalidFields.length > 0) {
        console.warn('⚠️ [ProjectContext]', timestamp(), 'CAMPOS INVÁLIDOS DETECTADOS:', invalidFields);
        console.warn('⚠️ [ProjectContext]', timestamp(), 'Estes campos serão REMOVIDOS!');
      }
      
      // Criar objeto limpo com APENAS campos válidos
      const cleanData: any = {};
      validFields.forEach(field => {
        if (field in projectData && projectData[field] !== undefined) {
          cleanData[field] = projectData[field];
        }
      });
      
      console.log('✅ [ProjectContext]', timestamp(), 'Dados LIMPOS (apenas campos válidos):', cleanData);
      console.log('✅ [ProjectContext]', timestamp(), 'Campos após limpeza:', Object.keys(cleanData));
      console.log('✅ [ProjectContext]', timestamp(), 'Total de campos válidos:', Object.keys(cleanData).length);
      
      // VALIDAÇÃO FINAL: Garantir que não há campos extras
      const finalFields = Object.keys(cleanData);
      const extraFields = finalFields.filter(f => !validFields.includes(f));
      
      if (extraFields.length > 0) {
        console.error('🚨 [ProjectContext]', timestamp(), 'ERRO CRÍTICO: Campos inválidos após limpeza:', extraFields);
        throw new Error(`Campos inválidos detectados após limpeza: ${extraFields.join(', ')}`);
      }

      console.log('💾 [ProjectContext]', timestamp(), 'Executando INSERT no Supabase...');
      console.log('💾 [ProjectContext]', timestamp(), 'Tabela: projects');
      console.log('💾 [ProjectContext]', timestamp(), 'Operação: INSERT');

      const { data, error } = await supabase
        .from('projects')
        .insert(cleanData)
        .select()
        .maybeSingle();

      if (error) {
        console.error('❌ [ProjectContext]', timestamp(), '====================================');
        console.error('❌ [ProjectContext]', timestamp(), 'ERRO NO SUPABASE');
        console.error('❌ [ProjectContext]', timestamp(), '====================================');
        console.error('❌ [ProjectContext]', timestamp(), 'Código:', error.code);
        console.error('❌ [ProjectContext]', timestamp(), 'Mensagem:', error.message);
        console.error('❌ [ProjectContext]', timestamp(), 'Detalhes:', error.details);
        console.error('❌ [ProjectContext]', timestamp(), 'Hint:', error.hint);
        console.error('❌ [ProjectContext]', timestamp(), 'Erro completo:', JSON.stringify(error, null, 2));
        throw new Error(`Erro no banco de dados: ${error.message}`);
      }

      if (!data) {
        console.error('❌ [ProjectContext]', timestamp(), 'INSERT não retornou dados');
        throw new Error('Projeto não foi criado - resposta vazia do banco');
      }

      console.log('✅ [ProjectContext]', timestamp(), '====================================');
      console.log('✅ [ProjectContext]', timestamp(), 'PROJETO INSERIDO COM SUCESSO!');
      console.log('✅ [ProjectContext]', timestamp(), '====================================');
      console.log('✅ [ProjectContext]', timestamp(), 'ID do projeto:', data.id);
      console.log('✅ [ProjectContext]', timestamp(), 'Título:', data.title);
      console.log('✅ [ProjectContext]', timestamp(), 'Cliente:', data.client);
      console.log('✅ [ProjectContext]', timestamp(), 'Share ID:', data.share_id);
      console.log('✅ [ProjectContext]', timestamp(), 'Dados completos:', data);

      console.log('🔄 [ProjectContext]', timestamp(), 'Atualizando lista de projetos...');
      await fetchProjects();
      console.log('✅ [ProjectContext]', timestamp(), 'Lista de projetos atualizada');
      
      toast({
        title: "✅ Sucesso",
        description: "Projeto criado com sucesso no banco de dados",
      });
      
    } catch (error: any) {
      console.error('💥 [ProjectContext]', timestamp(), '====================================');
      console.error('💥 [ProjectContext]', timestamp(), 'ERRO CAPTURADO NO CATCH');
      console.error('💥 [ProjectContext]', timestamp(), '====================================');
      console.error('💥 [ProjectContext]', timestamp(), 'Tipo:', error.constructor.name);
      console.error('💥 [ProjectContext]', timestamp(), 'Mensagem:', error.message);
      console.error('💥 [ProjectContext]', timestamp(), 'Stack:', error.stack);
      console.error('💥 [ProjectContext]', timestamp(), 'Erro completo:', error);
      
      toast({
        title: "❌ Erro",
        description: error.message || "Falha ao criar projeto no banco de dados",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchProjects();
      toast({
        title: "Sucesso",
        description: "Projeto atualizado com sucesso",
      });
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar projeto",
        variant: "destructive",
      });
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchProjects();
      toast({
        title: "Sucesso",
        description: "Projeto excluído com sucesso",
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir projeto",
        variant: "destructive",
      });
    }
  };

  const addFeedbackResponse = async (projectId: string, feedbackId: string, response: string, author: string = 'Equipe') => {
    try {
      const { error } = await supabase
        .from('project_feedback')
        .update({
          response,
          status: 'resolved'
        })
        .eq('id', feedbackId);

      if (error) throw error;

      await fetchProjects();
      toast({
        title: "Sucesso",
        description: "Resposta adicionada com sucesso",
      });
    } catch (error) {
      console.error('Error adding feedback response:', error);
      toast({
        title: "Erro",
        description: "Falha ao adicionar resposta",
        variant: "destructive",
      });
    }
  };

  const updateFeedbackStatus = async (projectId: string, feedbackId: string, status: 'resolved' | 'pending' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('project_feedback')
        .update({ status })
        .eq('id', feedbackId);

      if (error) throw error;

      await fetchProjects();
      toast({
        title: "Sucesso",
        description: "Status atualizado com sucesso",
      });
    } catch (error) {
      console.error('Error updating feedback status:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar status",
        variant: "destructive",
      });
    }
  };

  const getProjectStats = () => {
    const total = projects.length;
    const pending = projects.filter(p => p.status === "pending" || p.status === 'rejected').length;
    const approved = projects.filter(p => p.status === "approved").length;
    const inProgress = projects.filter(p => p.status === "in-progress").length;
    const archived = projects.filter(p => p.status === "archived").length;
    const feedbacks = projects.reduce((acc, p) => acc + p.keyframes.reduce((kfAcc, kf) => kfAcc + kf.feedbacks.length, 0), 0);
    
    // Calculate client satisfaction based on resolved feedbacks
    const totalFeedbacks = feedbacks;
    const resolvedFeedbacks = projects.reduce((acc, p) => 
      acc + p.keyframes.reduce((kfAcc, kf) => 
        kfAcc + kf.feedbacks.filter(f => f.status === 'resolved').length, 0), 0);
    
    const clientSatisfaction = totalFeedbacks > 0 ? Math.round((resolvedFeedbacks / totalFeedbacks) * 100) : 100;

    return {
      total,
      pending,
      approved,
      inProgress,
      archived,
      feedbacks,
      clientSatisfaction
    };
  };

  const sortByPriority = (projectList: Project[] = projects): Project[] => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    return [...projectList].sort((a, b) => {
      const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
      const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
      return priorityB - priorityA;
    });
  };

  const filterByPriority = (priority: Project['priority']): Project[] => {
    return projects.filter(project => project.priority === priority);
  };

  const filterByStatus = (status: Project['status']): Project[] => {
    return projects.filter(project => project.status === status);
  };

  const getProjectsByClient = (client: string): Project[] => {
    return projects.filter(project => project.client === client);
  };

  const getAllFeedbacks = () => {
    const allFeedbacks: any[] = [];
    projects.forEach(project => {
      project.keyframes.forEach(keyframe => {
        keyframe.feedbacks.forEach(feedback => {
          allFeedbacks.push({
            id: feedback.id,
            feedbackId: feedback.id,
            projectId: project.id,
            projectTitle: project.title,
            shareId: project.share_id,
            comment: feedback.comment,
            x_position: feedback.x_position,
            y_position: feedback.y_position,
            timestamp: feedback.created_at,
            status: feedback.status,
            author: project.client || 'Cliente',
            response: feedback.response,
            priority: project.priority,
            type: project.type,
          });
        });
      });
    });
    return allFeedbacks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const getOverdueProjects = (): Project[] => {
    const now = new Date();
    return projects.filter(project => {
      const createdDate = new Date(project.created_at);
      const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
      return daysDiff > 30 && (project.status === 'pending' || project.status === 'in-progress');
    });
  };

  const refreshProjects = async () => {
    await fetchProjects();
  };

  return (
    <ProjectContext.Provider value={{
      projects,
      loading,
      addProject,
      updateProject,
      deleteProject,
      getProjectStats,
      filterByPriority,
      filterByStatus,
      sortByPriority,
      getProjectsByClient,
      getOverdueProjects,
      addFeedbackResponse,
      updateFeedbackStatus,
      getAllFeedbacks,
      refreshProjects
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};