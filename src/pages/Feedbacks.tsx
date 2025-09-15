import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Search, MessageCircle, Clock, CheckCircle, XCircle, Reply, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";

const mockFeedbacks = [
  {
    id: 1,
    projectId: 1,
    projectTitle: "Campanha Verão 2024",
    shareId: "abc123",
    comment: "O logo precisa ficar mais destacado na tela inicial. Sugestão: aumentar o tamanho e adicionar uma sombra sutil para dar mais contraste.",
    time: 30,
    timestamp: "2024-01-15T10:30:00Z",
    status: "pending",
    author: "Cliente Premium",
    response: null
  },
  {
    id: 2,
    projectId: 1,
    projectTitle: "Campanha Verão 2024",
    shareId: "abc123",
    comment: "A música de fundo está muito alta em relação à narração. Favor diminuir o volume da trilha sonora.",
    time: 60,
    timestamp: "2024-01-15T11:00:00Z",
    status: "resolved",
    author: "Cliente Premium",
    response: "Ajustado conforme solicitado. Volume da trilha reduzido em 30%."
  },
  {
    id: 3,
    projectId: 3,
    projectTitle: "Podcast Episódio 12",
    shareId: "ghi789",
    comment: "Esta parte do áudio tem muito ruído de fundo. Seria possível fazer uma limpeza?",
    time: 120,
    timestamp: "2024-01-08T14:20:00Z",
    status: "pending",
    author: "Equipe Editorial",
    response: null
  },
  {
    id: 4,
    projectId: 2,
    projectTitle: "Banner Black Friday",
    shareId: "def456",
    comment: "Excelente trabalho! O design está perfeito e alinhado com nossa identidade visual.",
    time: 0,
    timestamp: "2024-01-10T09:15:00Z",
    status: "resolved",
    author: "Gerente de Marketing",
    response: "Obrigado pelo feedback positivo!"
  }
];

export default function Feedbacks() {
  const [feedbacks] = useState(mockFeedbacks);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [responseText, setResponseText] = useState("");
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const navigate = useNavigate();

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "resolved": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "pending": return "bg-amber-100 text-amber-800 border-amber-200";
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "resolved": return "Resolvido";
      case "pending": return "Pendente";
      case "rejected": return "Rejeitado";
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved": return <CheckCircle className="h-4 w-4" />;
      case "pending": return <Clock className="h-4 w-4" />;
      case "rejected": return <XCircle className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = feedback.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || feedback.status === statusFilter;
    const matchesProject = projectFilter === "all" || feedback.projectId.toString() === projectFilter;
    
    return matchesSearch && matchesStatus && matchesProject;
  });

  const uniqueProjects = Array.from(new Set(feedbacks.map(f => ({ id: f.projectId, title: f.projectTitle }))))
    .filter((project, index, self) => self.findIndex(p => p.id === project.id) === index);

  const handleResponse = (feedbackId: number) => {
    // Aqui você implementaria a lógica para salvar a resposta
    console.log(`Respondendo ao feedback ${feedbackId}: ${responseText}`);
    setRespondingTo(null);
    setResponseText("");
  };

  const handleViewProject = (shareId: string, time?: number) => {
    const url = `/aprovacao-audiovisual/${shareId}`;
    if (time) {
      // Aqui você poderia adicionar o timestamp como query parameter
      navigate(`${url}?t=${time}`);
    } else {
      navigate(url);
    }
  };

  const stats = {
    total: feedbacks.length,
    pending: feedbacks.filter(f => f.status === "pending").length,
    resolved: feedbacks.filter(f => f.status === "resolved").length,
    rejected: feedbacks.filter(f => f.status === "rejected").length
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Feedbacks" 
        subtitle="Central de comentários e avaliações dos projetos"
      />
      
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resolvidos</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.resolved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejeitados</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar feedbacks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="resolved">Resolvido</SelectItem>
              <SelectItem value="rejected">Rejeitado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full md:w-60">
              <SelectValue placeholder="Projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Projetos</SelectItem>
              {uniqueProjects.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lista de Feedbacks */}
        <div className="space-y-4">
          {filteredFeedbacks.map((feedback) => (
            <Card key={feedback.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Button 
                        variant="link" 
                        className="p-0 h-auto font-semibold text-primary hover:underline"
                        onClick={() => handleViewProject(feedback.shareId, feedback.time)}
                      >
                        {feedback.projectTitle}
                      </Button>
                      {feedback.time > 0 && (
                        <span className="text-sm text-muted-foreground">
                          ({formatTime(feedback.time)})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{feedback.author}</span>
                      <span>•</span>
                      <span>{new Date(feedback.timestamp).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                  
                  <Badge className={getStatusColor(feedback.status)}>
                    {getStatusIcon(feedback.status)}
                    <span className="ml-1">{getStatusText(feedback.status)}</span>
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-foreground leading-relaxed">
                  {feedback.comment}
                </p>

                {feedback.response && (
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Reply className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">Resposta da Equipe</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {feedback.response}
                    </p>
                  </div>
                )}

                {!feedback.response && feedback.status !== "rejected" && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setRespondingTo(respondingTo === feedback.id ? null : feedback.id)}
                    >
                      <Reply className="h-4 w-4 mr-2" />
                      {respondingTo === feedback.id ? "Cancelar" : "Responder"}
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleViewProject(feedback.shareId, feedback.time)}
                    >
                      Ver no Projeto
                    </Button>
                  </div>
                )}

                {respondingTo === feedback.id && (
                  <div className="space-y-3 p-4 bg-muted rounded-lg">
                    <Textarea
                      placeholder="Digite sua resposta..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleResponse(feedback.id)}
                        disabled={!responseText.trim()}
                      >
                        Enviar Resposta
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setRespondingTo(null);
                          setResponseText("");
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredFeedbacks.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum feedback encontrado</h3>
                <p className="text-muted-foreground">
                  Tente ajustar os filtros ou aguarde novos feedbacks dos projetos.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}