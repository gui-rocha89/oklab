import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Logo } from '@/components/ui/logo';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is already logged in and clear invalid tokens
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // If there's an error with the session, clear local storage
        if (error) {
          console.warn('Session error detected, clearing storage:', error.message);
          await supabase.auth.signOut();
          localStorage.clear();
          sessionStorage.clear();
          return;
        }
        
        if (session) {
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking session:', error);
        // Clear potentially corrupted data
        localStorage.clear();
        sessionStorage.clear();
      }
    };
    checkUser();
  }, [navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔄 Iniciando recuperação de senha para:', formData.email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        console.error('❌ Erro ao enviar email de recuperação:', error);
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('✅ Email de recuperação enviado com sucesso');
        toast({
          title: "Email enviado",
          description: "Verifique seu email para redefinir sua senha.",
        });
        setIsResetPassword(false);
        setFormData({ email: '', password: '', confirmPassword: '' });
      }
    } catch (error: any) {
      console.error('❌ Erro inesperado:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔐 Iniciando processo de autenticação...');
      console.log('📧 Email:', formData.email);
      console.log('🔄 Modo:', isSignUp ? 'Cadastro' : 'Login');
      
      if (isSignUp) {
        console.log('📝 Verificando senhas...');
        if (formData.password !== formData.confirmPassword) {
          console.log('❌ Senhas não coincidem');
          toast({
            title: "Erro",
            description: "As senhas não coincidem",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        console.log('📤 Enviando requisição de cadastro...');
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });

        if (error) {
          console.error('❌ Erro no cadastro:', error);
          toast({
            title: "Erro no cadastro",
            description: error.message,
            variant: "destructive",
          });
        } else {
          console.log('✅ Cadastro realizado com sucesso');
          toast({
            title: "Cadastro realizado!",
            description: "Verifique seu email para confirmar a conta.",
          });
        }
      } else {
        // Clear any existing corrupted data before login
        console.log('🧹 Limpando dados corrompidos...');
        try {
          await supabase.auth.signOut();
          console.log('✅ Dados limpos');
        } catch (e) {
          console.log('⚠️ Erro ao limpar dados (ignorando)');
        }
        
        console.log('🔑 Tentando fazer login...');
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          console.error('❌ Erro no login:', error);
          console.error('📊 Detalhes do erro:', {
            message: error.message,
            status: error.status,
            name: error.name
          });
          
          // Provide more specific error messages
          let errorMessage = error.message;
          
          if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Email ou senha incorretos. Verifique suas credenciais.';
            console.log('🚫 Credenciais inválidas detectadas');
          } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Por favor, confirme seu email antes de fazer login.';
            console.log('📧 Email não confirmado');
          } else if (error.message.includes('refresh_token_not_found')) {
            errorMessage = 'Sessão expirada. Por favor, tente novamente.';
            console.log('⏰ Token expirado - limpando storage');
            // Clear storage on token errors
            localStorage.clear();
            sessionStorage.clear();
          }
          
          toast({
            title: "Erro no login",
            description: errorMessage,
            variant: "destructive",
          });
        } else if (data.session) {
          console.log('✅ Login realizado com sucesso!');
          console.log('👤 Usuário:', data.user?.email);
          console.log('🎫 Token de acesso gerado');
          
          toast({
            title: "Login realizado com sucesso!",
            description: "Redirecionando...",
          });
          
          console.log('↪️ Navegando para home...');
          navigate('/');
        }
      }
    } catch (error) {
      console.error('❌ Erro fatal capturado:', error);
      toast({
        title: "Erro",
        description: "Algo deu errado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log('✅ Processo finalizado');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        <Card className="bg-white shadow-2xl border-0 rounded-3xl overflow-hidden">
          <CardContent className="p-12 text-center">
            {/* Logo */}
            <div className="mb-8">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6"
              >
                <Logo 
                  className="h-20 w-auto mx-auto" 
                  alt="MANUS I.A Logo" 
                />
              </motion.div>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray-600 text-sm leading-relaxed"
              >
                Acesso exclusivo aos tripulantes da galáxia<br />
                <span className="font-medium">streamlab.com.br</span>
              </motion.p>
            </div>

            {/* Form */}
            {isResetPassword ? (
              <motion.form 
                onSubmit={handleResetPassword} 
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Input
                  type="email"
                  placeholder="E-mail"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="h-12 border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                />

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium text-base rounded-xl mt-6 transition-all duration-200"
                >
                  {loading ? "ENVIANDO..." : "ENVIAR EMAIL DE RECUPERAÇÃO"}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setIsResetPassword(false);
                    setFormData({ email: '', password: '', confirmPassword: '' });
                  }}
                  className="w-full text-sm text-gray-600 hover:text-primary mt-4 transition-colors"
                >
                  Voltar ao login
                </button>
              </motion.form>
            ) : (
              <motion.form 
                onSubmit={handleSubmit} 
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Input
                  type="email"
                  placeholder="E-mail"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="h-12 border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                />

                <Input
                  type="password"
                  placeholder="Senha"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="h-12 border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                />

                {isSignUp && (
                  <Input
                    type="password"
                    placeholder="Confirmar Senha"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="h-12 border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                  />
                )}

                {!isSignUp && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setIsResetPassword(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium text-base rounded-xl mt-6 transition-all duration-200"
                >
                  {loading ? 
                    (isSignUp ? "CADASTRANDO..." : "ENTRANDO...") : 
                    (isSignUp ? "CADASTRAR" : "ENTRAR")
                  }
                </Button>

                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="w-full text-sm text-gray-600 hover:text-primary mt-4 transition-colors"
                >
                  {isSignUp ? 
                    "Já tem uma conta? Fazer login" : 
                    "Não tem uma conta? Cadastre-se"
                  }
                </button>
              </motion.form>
            )}

            {/* Footer */}
            <motion.div 
              className="mt-8 pt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-gray-400 text-xs">
                Um produto desenvolvido <span className="font-medium">By Stream Lab</span>
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}