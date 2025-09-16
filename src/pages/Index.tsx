import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Target, User, ArrowRight, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logoOrange from '@/assets/logo-orange-bg.png';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-12">
          <div className="inline-flex p-4 rounded-2xl bg-white shadow-lg mb-6">
            <img 
              src={logoOrange} 
              alt="StreamLab Logo" 
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-responsive-display text-foreground mb-4">
            StreamLab Platform
          </h1>
          <p className="text-responsive-title text-muted-foreground mb-4">
            Sistema Corporativo de Gestão Audiovisual
          </p>
          <div className="flex items-center justify-center gap-2 mb-8">
            <Lock className="h-4 w-4 text-primary" />
            <span className="text-caption text-primary font-medium">
              Acesso restrito para @streamlab.com.br
            </span>
          </div>
          <p className="text-body text-muted-foreground max-w-2xl mx-auto mb-8">
            Plataforma profissional com controle hierárquico de usuários, 
            dashboards personalizados e ferramentas avançadas de gestão de projetos audiovisuais.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-all duration-300 border-primary/20">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-red-500 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-ui">Supreme Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-caption text-muted-foreground">
                Controle total da plataforma com acesso irrestrito
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-primary/20">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-ui">Manager</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-caption text-muted-foreground">
                Gestão estratégica de projetos e equipes
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-primary/20">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-ui">Team Lead</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-caption text-muted-foreground">
                Coordenação operacional de projetos específicos
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-primary/20">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-gray-500 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-ui">Usuário</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-caption text-muted-foreground">
                Acesso controlado aos próprios projetos
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Button 
            size="lg" 
            className="text-ui px-8 py-3 bg-primary hover:bg-primary/90"
            onClick={() => navigate('/auth')}
          >
            Acessar Sistema StreamLab
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-caption text-muted-foreground">
            Entre com suas credenciais corporativas @streamlab.com.br
          </p>
        </div>

        <div className="mt-16 p-6 bg-white/50 rounded-2xl border border-primary/20">
          <h3 className="text-heading text-foreground mb-4">Sistema Corporativo Seguro</h3>
          <div className="grid md:grid-cols-3 gap-4 text-caption text-muted-foreground">
            <div>✓ Autenticação por domínio</div>
            <div>✓ Controle hierárquico</div>
            <div>✓ Dashboards personalizados</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
