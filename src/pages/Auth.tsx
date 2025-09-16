import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, LogIn, UserPlus, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import logoOrange from '@/assets/logo-orange-bg.png';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (!error) {
          const from = location.state?.from?.pathname || '/';
          navigate(from, { replace: true });
        }
      } else {
        const { error } = await signUp(formData.email, formData.password, formData.fullName);
        if (!error) {
          // Stay on auth page to show success message
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex p-3 rounded-2xl bg-white shadow-lg mb-6">
            <img 
              src={logoOrange} 
              alt="StreamLab Logo" 
              className="h-12 w-auto"
            />
          </div>
          <h1 className="text-responsive-heading text-foreground mb-2">
            StreamLab Platform
          </h1>
          <p className="text-caption text-muted-foreground">
            Sistema de Gestão de Projetos Audiovisuais
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-caption text-primary font-medium">
              Acesso restrito @streamlab.com.br
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-xl border-0 overflow-hidden bg-white">
            <CardHeader className="bg-primary text-white text-center">
              <CardTitle className="text-responsive-title flex items-center justify-center gap-2">
                {isLogin ? (
                  <>
                    <LogIn className="h-5 w-5" />
                    Acessar Sistema
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    Criar Conta Corporativa
                  </>
                )}
              </CardTitle>
              <CardDescription className="text-primary-foreground/80">
                {isLogin 
                  ? 'Entre com suas credenciais StreamLab'
                  : 'Registre-se com seu email corporativo'
                }
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Nome completo"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          className="pl-10 h-12 border-border focus:ring-primary focus:border-primary"
                          required={!isLogin}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="email@streamlab.com.br"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10 h-12 border-border focus:ring-primary focus:border-primary"
                    pattern=".*@streamlab\.com\.br$"
                    title="Apenas emails do domínio @streamlab.com.br são permitidos"
                    required
                  />
                  {!isLogin && (
                    <p className="text-caption text-muted-foreground mt-1">
                      * Apenas emails corporativos @streamlab.com.br
                    </p>
                  )}
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Senha"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-10 pr-10 h-12 border-border focus:ring-primary focus:border-primary"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-ui bg-primary hover:bg-primary/90"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {isLogin ? 'Entrando...' : 'Criando conta...'}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {isLogin ? 'Entrar no Sistema' : 'Criar Conta'}
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </form>

              <div className="text-center pt-4 border-t border-border">
                <p className="text-caption text-muted-foreground mb-3">
                  {isLogin 
                    ? 'Não possui conta corporativa?' 
                    : 'Já possui conta?'
                  }
                </p>
                <Button
                  variant="ghost"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:text-primary/80 hover:bg-primary/10"
                  disabled={loading}
                >
                  {isLogin ? 'Solicitar acesso' : 'Fazer login'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-6"
        >
          <p className="text-caption text-muted-foreground">
            © 2024 StreamLab. Sistema corporativo seguro.
          </p>
          <p className="text-caption text-primary mt-1">
            Plataforma de gestão audiovisual profissional
          </p>
        </motion.div>
      </div>
    </div>
  );
}