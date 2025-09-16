import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Target, User, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-12">
          <h1 className="text-responsive-display text-foreground mb-4">
            StreamLab Platform
          </h1>
          <p className="text-responsive-title text-muted-foreground mb-8">
            Sistema Completo de Gestão de Projetos Audiovisuais
          </p>
          <p className="text-body text-muted-foreground max-w-2xl mx-auto mb-8">
            Controle total sobre seus projetos com sistema de hierarquia de usuários, 
            dashboards personalizados e ferramentas profissionais de gestão.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-red-500 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-ui">Supreme Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-caption text-muted-foreground">
                Controle total da plataforma com acesso a todas as funcionalidades
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-ui">Manager</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-caption text-muted-foreground">
                Gestão de projetos e equipes com relatórios avançados
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-ui">Team Lead</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-caption text-muted-foreground">
                Liderança de projetos específicos com coordenação de atividades
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-gray-500 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-ui">Usuário</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-caption text-muted-foreground">
                Acesso a projetos próprios com ferramentas de acompanhamento
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Button 
            size="lg" 
            className="text-ui px-8 py-3"
            onClick={() => navigate('/auth')}
          >
            Acessar Plataforma
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-caption text-muted-foreground">
            Faça login ou registre-se para começar
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
