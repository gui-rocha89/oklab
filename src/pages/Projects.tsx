import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Grid, List, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const mockProjects = [
  {
    id: 1,
    shareId: "abc123",
    title: "Campanha Verão 2024",
    description: "Vídeo promocional para a nova coleção de verão",
    status: "pending",
    priority: "high",
    author: "Maria Silva",
    type: "Vídeo",
    createdAt: "2024-01-15",
    keyframes: [
      { id: 1, time: 30, comment: "Ajustar cor do logo", timestamp: "2024-01-15T10:30:00Z" },
      { id: 2, time: 60, comment: "Música muito alta", timestamp: "2024-01-15T11:00:00Z" }
    ]
  },
  {
    id: 2,
    shareId: "def456",
    title: "Banner Black Friday",
    description: "Design para banner da promoção Black Friday",
    status: "approved",
    priority: "medium",
    author: "João Santos",
    type: "Design",
    createdAt: "2024-01-10",
    keyframes: []
  },
  {
    id: 3,
    shareId: "ghi789",
    title: "Podcast Episódio 12",
    description: "Edição do episódio sobre marketing digital",
    status: "feedback-sent",
    priority: "low",
    author: "Ana Costa",
    type: "Audiovisual",
    createdAt: "2024-01-08",
    keyframes: [
      { id: 3, time: 120, comment: "Cortar essa parte", timestamp: "2024-01-08T14:20:00Z" }
    ]
  }
];

export default function Projects() {
  const [projects] = useState(mockProjects);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const navigate = useNavigate();

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "approved": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "pending": return "bg-amber-100 text-amber-800 border-amber-200";
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      case "feedback-sent": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "approved": return "Aprovado";
      case "pending": return "Pendente";
      case "rejected": return "Rejeitado";
      case "feedback-sent": return "Feedback Enviado";
      default: return status;
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || project.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleViewProject = (shareId: string) => {
    navigate(`/aprovacao-audiovisual/${shareId}`);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Projetos" 
        subtitle="Gerencie todos os seus projetos em um só lugar"
      />
      
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Filtros e Busca */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar projetos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
                <SelectItem value="feedback-sent">Feedback Enviado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Prioridades</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button className="ml-2">
              <Plus className="h-4 w-4 mr-2" />
              Novo Projeto
            </Button>
          </div>
        </div>

        {/* Lista/Grid de Projetos */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold text-foreground line-clamp-2">
                      {project.title}
                    </CardTitle>
                    <Badge className={getPriorityColor(project.priority)}>
                      {project.priority === "high" ? "Alta" : project.priority === "medium" ? "Média" : "Baixa"}
                    </Badge>
                  </div>
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusText(project.status)}
                  </Badge>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {project.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{project.author}</span>
                    <span>{project.type}</span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Criado em {new Date(project.createdAt).toLocaleDateString('pt-BR')}
                  </div>

                  {project.keyframes.length > 0 && (
                    <div className="text-xs text-primary">
                      {project.keyframes.length} comentário{project.keyframes.length !== 1 ? 's' : ''}
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleViewProject(project.shareId)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Projeto
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredProjects.map((project) => (
                  <div key={project.id} className="p-6 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground truncate">
                            {project.title}
                          </h3>
                          <Badge className={getStatusColor(project.status)}>
                            {getStatusText(project.status)}
                          </Badge>
                          <Badge className={getPriorityColor(project.priority)}>
                            {project.priority === "high" ? "Alta" : project.priority === "medium" ? "Média" : "Baixa"}
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground text-sm mb-2 line-clamp-1">
                          {project.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{project.author}</span>
                          <span>{project.type}</span>
                          <span>{new Date(project.createdAt).toLocaleDateString('pt-BR')}</span>
                          {project.keyframes.length > 0 && (
                            <span className="text-primary">
                              {project.keyframes.length} comentário{project.keyframes.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button 
                          size="sm" 
                          onClick={() => handleViewProject(project.shareId)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Projeto
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {filteredProjects.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum projeto encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Tente ajustar os filtros ou criar um novo projeto.
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Novo Projeto
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}