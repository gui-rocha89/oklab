import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactPlayer from "react-player";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Rocket
} from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";

// Mock project data
const mockProject = {
  id: 1,
  shareId: "abc123",
  title: "Campanha Verão 2024",
  description: "Vídeo promocional para a campanha de verão da marca",
  status: "pending",
  priority: "high",
  author: "Maria Silva",
  createdAt: "2024-01-15T10:00:00Z",
  type: "Vídeo",
  videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  keyframes: [
    { id: 1, time: 15.5, comment: "Ajustar cor do texto principal", timestamp: "2024-01-15T11:30:00Z" },
    { id: 2, time: 32.2, comment: "Logo da empresa está muito pequena aqui", timestamp: "2024-01-15T14:20:00Z" },
    { id: 3, time: 58.7, comment: "Transição muito rápida, sugerir 2s a mais", timestamp: "2024-01-15T16:45:00Z" }
  ]
};

export default function AudiovisualApproval() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [project] = useState(mockProject);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [selectedKeyframe, setSelectedKeyframe] = useState<number | null>(null);
  const [showApprovalConfirmation, setShowApprovalConfirmation] = useState(false);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleSeekToKeyframe = (time: number) => {
    setCurrentTime(time);
    setSelectedKeyframe(time);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const newKeyframe = {
      id: Date.now(),
      time: currentTime,
      comment: newComment,
      timestamp: new Date().toISOString()
    };

    // In a real app, this would be sent to the backend
    console.log("New keyframe:", newKeyframe);
    setNewComment("");
    
    toast({
      title: "Comentário adicionado",
      description: `Comentário adicionado em ${Math.floor(currentTime)}s`,
    });
  };

  const handleApprove = () => {
    setShowApprovalConfirmation(true);
  };

  const handleReject = () => {
    toast({
      title: "Projeto rejeitado",
      description: "O projeto foi rejeitado e o feedback foi enviado.",
      variant: "destructive",
    });
    
    setTimeout(() => {
      navigate("/");
    }, 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showApprovalConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-glow animate-scale-in">
          <CardContent className="p-8 text-center">
            <div className="mb-6 animate-pulse-glow">
              <Rocket className="h-16 w-16 mx-auto text-primary-foreground mb-4" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Projeto Aprovado! 🚀
            </h2>
            <p className="text-muted-foreground mb-6">
              O projeto "{project.title}" foi aprovado com sucesso. A equipe será notificada.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => navigate("/")}
                className="w-full"
                size="lg"
              >
                Voltar ao Dashboard
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowApprovalConfirmation(false)}
                className="w-full"
              >
                Revisar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title={project.title}
        subtitle={`${project.type} • ${project.author} • ${new Date(project.createdAt).toLocaleDateString()}`}
      />
      
      <main className="p-6 space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player Section */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-card overflow-hidden">
              <div className="aspect-video bg-black relative flex items-center justify-center">
                {/* Placeholder for video player */}
                <div className="text-white text-center">
                  <Play className="h-16 w-16 mx-auto mb-4 opacity-60" />
                  <p className="text-lg font-medium">Vídeo: {project.title}</p>
                  <p className="text-sm opacity-60 mt-2">Player será integrado</p>
                </div>
                
                {/* Custom Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <div className="space-y-3">
                    {/* Progress Bar */}
                    <div className="relative">
                      <Slider
                        value={[currentTime]}
                        max={duration}
                        step={0.1}
                        onValueChange={([value]) => setCurrentTime(value)}
                        className="w-full"
                      />
                      {/* Keyframe Markers */}
                      {project.keyframes.map((keyframe) => (
                        <div
                          key={keyframe.id}
                          className="absolute top-0 h-full w-1 bg-accent cursor-pointer hover:bg-accent-foreground transition-colors"
                          style={{ left: `${(keyframe.time / duration) * 100}%` }}
                          onClick={() => handleSeekToKeyframe(keyframe.time)}
                          title={keyframe.comment}
                        />
                      ))}
                    </div>
                    
                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handlePlayPause}
                          className="text-white hover:text-primary hover:bg-white/20"
                        >
                          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleMute}
                          className="text-white hover:text-primary hover:bg-white/20"
                        >
                          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                        </Button>
                        
                        <div className="flex items-center gap-2 text-white">
                          <span className="text-sm">{formatTime(currentTime)}</span>
                          <span className="text-xs opacity-60">/</span>
                          <span className="text-sm opacity-60">{formatTime(duration)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Add Comment Section */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Adicionar Comentário
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Tempo atual: {formatTime(currentTime)}
                  </div>
                  <Textarea
                    placeholder="Deixe seu feedback sobre este momento do vídeo..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-20"
                  />
                  <Button onClick={handleAddComment} className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Adicionar Comentário
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comments and Actions Sidebar */}
          <div className="space-y-6">
            {/* Project Info */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Informações do Projeto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium text-foreground">{project.title}</p>
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {project.type}
                  </Badge>
                  <Badge 
                    variant={project.priority === "high" ? "destructive" : "secondary"} 
                    className="text-xs"
                  >
                    Prioridade {project.priority === "high" ? "Alta" : "Média"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Comments Timeline */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-accent" />
                  Comentários ({project.keyframes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {project.keyframes.map((keyframe) => (
                    <div 
                      key={keyframe.id} 
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedKeyframe === keyframe.time 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-muted-foreground"
                      }`}
                      onClick={() => handleSeekToKeyframe(keyframe.time)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-3 w-3 text-primary" />
                        <span className="text-xs font-medium text-primary">
                          {formatTime(keyframe.time)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mb-2">{keyframe.comment}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(keyframe.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                  
                  {project.keyframes.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum comentário ainda</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={handleApprove}
                className="bg-success hover:bg-success/90 text-success-foreground"
                size="lg"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Aprovar
              </Button>
              <Button 
                onClick={handleReject}
                variant="destructive"
                size="lg"
              >
                <XCircle className="h-5 w-5 mr-2" />
                Rejeitar
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}