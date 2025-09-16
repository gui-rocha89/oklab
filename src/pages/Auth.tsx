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
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl bg-white rounded-3xl p-8 border-0">
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4 mb-8">
              <img 
                src={logoOrange} 
                alt="OKLAB" 
                className="h-20 w-auto object-contain"
              />
              <p className="text-sm text-neutral-medium text-center leading-relaxed">
                Acesso exclusivo aos tripulantes da galáxia<br />
                streamlab.com.br
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Input
                      type="text"
                      placeholder="Nome Completo"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      required={!isLogin}
                      className="h-12 px-4 rounded-xl border-neutral-light focus:border-primary focus:ring-primary"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <Input
                type="email"
                placeholder="E-mail"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                pattern=".*@streamlab\.com\.br$"
                title="Apenas emails do domínio @streamlab.com.br são permitidos"
                className="h-12 px-4 rounded-xl border-neutral-light focus:border-primary focus:ring-primary"
              />

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Senha"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  minLength={6}
                  className="h-12 px-4 pr-10 rounded-xl border-neutral-light focus:border-primary focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-medium hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl text-base mt-6"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isLogin ? 'ENTRANDO...' : 'CADASTRANDO...'}
                  </div>
                ) : (
                  isLogin ? 'ENTRAR' : 'CADASTRAR'
                )}
              </Button>
            </form>

            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-neutral-medium hover:text-foreground transition-colors"
                disabled={loading}
              >
                {isLogin 
                  ? 'Não tem uma conta? Cadastre-se' 
                  : 'Já tem uma conta? Entre'
                }
              </button>
            </div>

            <div className="text-center mt-8">
              <p className="text-sm text-neutral-medium">
                by Stream Lab
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}