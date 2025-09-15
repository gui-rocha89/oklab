// Legacy Index page - now redirects to Dashboard

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to main dashboard
    navigate("/", { replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-primary">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-primary-foreground">OkLab</h1>
        <p className="text-xl text-primary-foreground/80">Plataforma de Aprovação de Conteúdos</p>
      </div>
    </div>
  );
};

export default Index;
