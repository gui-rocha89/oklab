import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FeedbackUpdate {
  id: string;
  resolved?: boolean;
  team_response?: string;
  team_attachments?: any[];
}

export const useProjectFeedbackManagement = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const updateFeedback = async (feedbackId: string, updates: Partial<FeedbackUpdate>) => {
    setIsUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      if (updates.resolved !== undefined) {
        updateData.resolved_at = updates.resolved ? new Date().toISOString() : null;
        updateData.team_user_id = user?.id;
      }

      const { error } = await supabase
        .from('project_feedback')
        .update(updateData)
        .eq('id', feedbackId);

      if (error) throw error;

      toast({
        title: updates.resolved ? 'Ajuste marcado como resolvido' : 'Resposta salva',
        description: updates.resolved 
          ? 'O ajuste foi marcado como concluído'
          : 'Sua resposta foi adicionada ao comentário',
      });

      return true;
    } catch (error) {
      console.error('Error updating feedback:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o feedback',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const resendProject = async (projectId: string, videoFile: File, message?: string) => {
    setIsResending(true);
    setUploadProgress(0);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      // Simulate upload progress (since FormData doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const formData = new FormData();
      formData.append('projectId', projectId);
      formData.append('videoFile', videoFile);
      if (message) {
        formData.append('message', message);
      }

      const response = await supabase.functions.invoke('resend-project', {
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.error) throw response.error;

      toast({
        title: 'Projeto reenviado com sucesso',
        description: 'O vídeo foi atualizado e um novo link foi gerado',
      });

      return response.data;
    } catch (error) {
      console.error('Error resending project:', error);
      toast({
        title: 'Erro ao reenviar projeto',
        description: error.message || 'Não foi possível reenviar o projeto',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsResending(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  return {
    updateFeedback,
    resendProject,
    isUpdating,
    isResending,
    uploadProgress,
  };
};