import { createContext, useContext, useState, ReactNode } from 'react';

// Enhanced project interface with comparison data
export interface Project {
  id: number;
  shareId: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'feedback-sent' | 'in-progress' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  author: string;
  createdAt: string;
  updatedAt?: string;
  type: 'Vídeo' | 'Audiovisual' | 'Design' | 'Documento' | 'Apresentação';
  keyframes: Array<{
    id: number;
    time: number;
    comment: string;
    timestamp: string;
    resolved?: boolean;
  }>;
  // New comparison properties
  vsLastMonth?: number; // Percentage change
  estimatedHours?: number;
  actualHours?: number;
  budget?: number;
  client?: string;
  department?: string;
  tags?: string[];
  viewCount?: number;
  approvalTime?: number; // hours to approve
}

// Enhanced mock data with comparison metrics
const enhancedMockProjects: Project[] = [
  {
    id: 1,
    shareId: "abc123",
    title: "Campanha Verão 2024",
    description: "Vídeo promocional para a campanha de verão",
    status: "pending",
    priority: "high",
    author: "Maria Silva",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-16T14:30:00Z",
    type: "Vídeo",
    vsLastMonth: 25,
    estimatedHours: 40,
    actualHours: 35,
    budget: 15000,
    client: "Loja Fashion",
    department: "Marketing",
    tags: ["campanha", "verão", "promocional"],
    viewCount: 1250,
    approvalTime: 24,
    keyframes: [
      { id: 1, time: 15.5, comment: "Ajustar cor do texto", timestamp: "2024-01-15T11:30:00Z", resolved: false },
      { id: 2, time: 32.2, comment: "Logo muito pequena aqui", timestamp: "2024-01-15T14:20:00Z", resolved: false }
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
    updatedAt: "2024-01-15T16:45:00Z",
    type: "Audiovisual",
    vsLastMonth: -8,
    estimatedHours: 20,
    actualHours: 18,
    budget: 8000,
    client: "TechCorp",
    department: "Produto",
    tags: ["tutorial", "produto", "explicativo"],
    viewCount: 890,
    approvalTime: 12,
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
    updatedAt: "2024-01-14T10:15:00Z",
    type: "Apresentação",
    vsLastMonth: 45,
    estimatedHours: 15,
    actualHours: 22,
    budget: 12000,
    client: "Investidores",
    department: "Financeiro",
    tags: ["apresentação", "trimestral", "investidores"],
    viewCount: 156,
    approvalTime: 8,
    keyframes: [
      { id: 3, time: 45.1, comment: "Gráfico precisa de mais destaque", timestamp: "2024-01-14T08:15:00Z", resolved: true }
    ]
  },
  {
    id: 4,
    shareId: "jkl012",
    title: "Identidade Visual Nova",
    description: "Desenvolvimento da nova identidade visual da marca",
    status: "in-progress",
    priority: "urgent",
    author: "Carlos Design",
    createdAt: "2024-01-12T08:00:00Z",
    updatedAt: "2024-01-16T09:30:00Z",
    type: "Design",
    vsLastMonth: 15,
    estimatedHours: 60,
    actualHours: 45,
    budget: 25000,
    client: "Empresa ABC",
    department: "Branding",
    tags: ["identidade", "visual", "marca", "logo"],
    viewCount: 2340,
    approvalTime: 36,
    keyframes: []
  },
  {
    id: 5,
    shareId: "mno345",
    title: "Manual de Processos",
    description: "Documentação completa dos processos internos",
    status: "approved",
    priority: "medium",
    author: "Patricia Docs",
    createdAt: "2024-01-11T14:00:00Z",
    updatedAt: "2024-01-13T11:20:00Z",
    type: "Documento",
    vsLastMonth: -12,
    estimatedHours: 30,
    actualHours: 28,
    budget: 5000,
    client: "Interno",
    department: "RH",
    tags: ["manual", "processos", "documentação"],
    viewCount: 445,
    approvalTime: 18,
    keyframes: []
  }
];

interface ProjectContextType {
  projects: Project[];
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (id: number, updates: Partial<Project>) => void;
  deleteProject: (id: number) => void;
  getProjectStats: () => {
    total: number;
    pending: number;
    approved: number;
    inProgress: number;
    archived: number;
    feedbacks: number;
    avgApprovalTime: number;
    totalBudget: number;
    efficiency: number;
    clientSatisfaction: number;
  };
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>(enhancedMockProjects);

  const addProject = (project: Omit<Project, 'id'>) => {
    const newProject = {
      ...project,
      id: Math.max(...projects.map(p => p.id)) + 1,
    };
    setProjects(prev => [...prev, newProject]);
  };

  const updateProject = (id: number, updates: Partial<Project>) => {
    setProjects(prev => 
      prev.map(project => 
        project.id === id 
          ? { ...project, ...updates, updatedAt: new Date().toISOString() }
          : project
      )
    );
  };

  const deleteProject = (id: number) => {
    setProjects(prev => prev.filter(project => project.id !== id));
  };

  const getProjectStats = () => {
    const total = projects.length;
    const pending = projects.filter(p => p.status === "pending" || p.status === 'rejected').length;
    const approved = projects.filter(p => p.status === "approved").length;
    const inProgress = projects.filter(p => p.status === "in-progress").length;
    const archived = projects.filter(p => p.status === "archived").length;
    const feedbacks = projects.reduce((acc, p) => acc + p.keyframes.length, 0);
    
    const approvalTimes = projects.filter(p => p.approvalTime).map(p => p.approvalTime!);
    const avgApprovalTime = approvalTimes.length > 0 
      ? approvalTimes.reduce((a, b) => a + b, 0) / approvalTimes.length 
      : 0;
    
    const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
    
    // Calculate efficiency (actual vs estimated hours)
    const projectsWithHours = projects.filter(p => p.estimatedHours && p.actualHours);
    const efficiency = projectsWithHours.length > 0
      ? projectsWithHours.reduce((acc, p) => acc + ((p.estimatedHours! / p.actualHours!) * 100), 0) / projectsWithHours.length
      : 100;
    
    // Mock client satisfaction (in real app, this would come from feedback data)
    const clientSatisfaction = 92;

    return {
      total,
      pending,
      approved,
      inProgress,
      archived,
      feedbacks,
      avgApprovalTime: Math.round(avgApprovalTime),
      totalBudget,
      efficiency: Math.round(efficiency),
      clientSatisfaction
    };
  };

  return (
    <ProjectContext.Provider value={{
      projects,
      addProject,
      updateProject,
      deleteProject,
      getProjectStats
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