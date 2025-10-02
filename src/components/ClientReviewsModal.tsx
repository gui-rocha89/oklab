import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, User, Mail, Calendar, MessageSquare, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClientReview {
  id: string;
  rating: number;
  comment: string | null;
  client_name: string | null;
  client_email: string;
  created_at: string;
  project_title: string;
  project_client: string;
}

interface ClientReviewsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviews: ClientReview[];
  loading?: boolean;
}

const ClientReviewsModal = ({ open, onOpenChange, reviews, loading }: ClientReviewsModalProps) => {
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "fill-warning text-warning" : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    );
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-warning" />
            Avaliações dos Clientes
          </DialogTitle>
          <DialogDescription>
            Visão geral de todas as avaliações recebidas na plataforma
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando avaliações...</p>
            </div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma avaliação recebida ainda</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Estatísticas Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-warning/20 rounded-lg">
                      <Star className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-warning">{averageRating}</p>
                      <p className="text-sm text-muted-foreground">Média Geral</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <MessageSquare className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{reviews.length}</p>
                      <p className="text-sm text-muted-foreground">Total de Avaliações</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-success/10 rounded-lg">
                      <Sparkles className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">
                        {reviews.filter(r => r.rating >= 4).length}
                      </p>
                      <p className="text-sm text-muted-foreground">Avaliações Positivas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Avaliações */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Todas as Avaliações</h3>
              
              {reviews.map((review) => (
                <Card key={review.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Cabeçalho */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {renderStars(review.rating)}
                            <Badge variant="secondary" className="ml-2">
                              {review.rating}/5
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">
                              Projeto: <span className="text-foreground">{review.project_title}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Cliente do Projeto: <span className="text-foreground">{review.project_client}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(review.created_at), "dd/MM/yy", { locale: ptBR })}
                        </div>
                      </div>

                      {/* Comentário */}
                      {review.comment && (
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <p className="text-sm leading-relaxed">{review.comment}</p>
                        </div>
                      )}

                      {/* Informações do Avaliador */}
                      <div className="flex items-center gap-4 pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {review.client_name || "Cliente Anônimo"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          {review.client_email}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClientReviewsModal;
