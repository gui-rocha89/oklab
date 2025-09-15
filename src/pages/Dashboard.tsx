import { useState, useEffect } from "react";
import { FileVideo, MessageSquare, Clock, CheckCircle, XCircle, TrendingUp } from "lucide-react";
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

export default function Dashboard() {
  const [projects, setProjects] = useState(mockProjects);

  // Calculate statistics
  const stats = {
    total: projects.length,
    pending: projects.filter(p => p.status === "pending").length,
    approved: projects.filter(p => p.status === "approved").length,
    feedbacks: projects.reduce((acc, p) => acc + p.keyframes.length, 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "success";
      case "rejected": return "destructive";
      case "pending": return "warning";
      case "feedback-sent": return "primary";
      default: return "secondary";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved": return "Aprovado";
      case "rejected": return "Rejeitado";
      case "pending": return "Pendente";
      case "feedback-sent": return "Feedback Enviado";
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-destructive/10 text-destructive";
      case "medium": return "bg-warning/10 text-warning";
      case "low": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Dashboard" 
        subtitle="Visão geral dos projetos e atividades"
      />
      
      <main className="p-6 space-y-8 animate-fade-in">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-card hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Projetos</p>
                  <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                </div>
                <FileVideo className="h-8 w-8 text-primary" />
              </div>
              <div className="mt-4 flex items-center text-sm text-success">
                <TrendingUp className="h-4 w-4 mr-1" />
                +12% este mês
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                  <p className="text-3xl font-bold text-foreground">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-warning" />
              </div>
              <div className="mt-4 flex items-center text-sm text-warning">
                Requer atenção
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Aprovados</p>
                  <p className="text-3xl font-bold text-foreground">{stats.approved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <div className="mt-4 flex items-center text-sm text-success">
                Finalizados com sucesso
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Feedbacks</p>
                  <p className="text-3xl font-bold text-foreground">{stats.feedbacks}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-accent" />
              </div>
              <div className="mt-4 flex items-center text-sm text-muted-foreground">
                Comentários ativos
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Projects */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileVideo className="h-5 w-5 text-primary" />
                Projetos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.slice(0, 3).map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground truncate">{project.title}</h4>
                        <Badge 
                          variant="secondary" 
                          className={`${getPriorityColor(project.priority)} text-xs`}
                        >
                          {project.priority === "high" ? "Alta" : project.priority === "medium" ? "Média" : "Baixa"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{project.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={getStatusColor(project.status) as any} className="text-xs">
                          {getStatusText(project.status)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">por {project.author}</span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.href = `/aprovacao-audiovisual/${project.shareId}`}
                      className="ml-4 whitespace-nowrap"
                    >
                      Ver Projeto
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" className="w-full">
                  Ver Todos os Projetos
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Feedbacks Section */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-accent" />
                Feedbacks Recebidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.filter(p => p.keyframes.length > 0).map((project) => (
                  <div key={project.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">{project.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {project.keyframes.length} comentários
                      </Badge>
                    </div>
                    <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                      {project.keyframes.map((keyframe) => (
                        <div key={keyframe.id} className="p-2 bg-muted/30 rounded text-sm">
                          <p className="text-foreground">{keyframe.comment}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Em {Math.floor(keyframe.time)}s - {new Date(keyframe.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {projects.filter(p => p.keyframes.length > 0).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum feedback recebido ainda</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}