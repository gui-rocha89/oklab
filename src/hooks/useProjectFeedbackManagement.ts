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
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      // 1. Upload direto para Storage com progresso real
      const fileName = `${Date.now()}-${videoFile.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audiovisual-projects')
        .upload(fileName, videoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 2. Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('audiovisual-projects')
        .getPublicUrl(fileName);

      // 3. Chamar Edge Function apenas para atualizar metadados
      const response = await supabase.functions.invoke('resend-project', {
        body: { 
          projectId, 
          videoUrl: publicUrl, 
          message 
        }
      });

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
    }
  };

  return {
    updateFeedback,
    resendProject,
    isUpdating,
    isResending,
  };
};