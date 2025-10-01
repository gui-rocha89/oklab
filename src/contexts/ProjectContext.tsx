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
  completed_at?: string;
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
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, totalReviews: 0 });
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
      
      // Fetch review statistics
      await fetchReviewStats();
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

  const fetchReviewStats = async () => {
    try {
      const { data: reviews, error } = await supabase
        .from('platform_reviews')
        .select('rating');

      if (error) throw error;

      if (reviews && reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;
        setReviewStats({
          averageRating,
          totalReviews: reviews.length
        });
      }
    } catch (error) {
      console.error('Error fetching review stats:', error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const addProject = async (projectData: any) => {
    try {
      // Lista de campos válidos da tabela projects
      const validFields = ['title', 'client', 'description', 'type', 'status', 'priority', 'user_id', 'share_id', 'video_url', 'approval_date'];
      
      // Criar objeto limpo com APENAS campos válidos
      const cleanData: any = {};
      validFields.forEach(field => {
        if (field in projectData && projectData[field] !== undefined) {
          cleanData[field] = projectData[field];
        }
      });

      const { data, error } = await supabase
        .from('projects')
        .insert(cleanData)
        .select()
        .single();

      if (error) throw error;

      // Adicionar o novo projeto ao estado local imediatamente
      const newProject = {
        ...data,
        keyframes: [],
        feedbacks: []
      };
      
      setProjects(prev => [newProject, ...prev]);
      
      toast({
        title: "Sucesso",
        description: "Projeto criado com sucesso",
      });
      
      return newProject;
    } catch (error: any) {
      console.error('Erro ao criar projeto:', error);
      
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar projeto",
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
      console.log('🗑️ Iniciando exclusão completa do projeto:', id);

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      // Call edge function for complete deletion
      const { data, error } = await supabase.functions.invoke('delete-project', {
        body: { projectId: id },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Falha ao excluir projeto');
      }

      console.log('✅ Projeto excluído com sucesso!');
      console.log('📊 Itens removidos:', data.deletedItems);

      await fetchProjects();
      
      toast({
        title: "Sucesso",
        description: `Projeto excluído completamente. ${data.deletedItems.keyframes} keyframes, ${data.deletedItems.feedbacks} feedbacks, ${data.deletedItems.storageFiles} arquivos removidos.`,
      });
    } catch (error: any) {
      console.error('❌ Erro ao excluir projeto:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao excluir projeto",
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
    
    // Calculate client satisfaction based on platform reviews (ratings)
    // Convert average rating (1-5) to percentage (0-100)
    const clientSatisfaction = reviewStats.totalReviews > 0 
      ? Math.round((reviewStats.averageRating / 5) * 100)
      : 85; // Default value when no reviews exist

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