import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import logoWhite from '@/assets/logo-white-bg.png';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkUser();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando...",
        });
        navigate('/');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Algo deu errado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
              <motion.img
                src={logoWhite}
                alt="MANUS I.A Logo"
                className="h-20 w-auto mx-auto mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              />
              
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium text-base rounded-xl mt-6 transition-all duration-200"
              >
                {loading ? "ENTRANDO..." : "ENTRAR"}
              </Button>
            </motion.form>

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