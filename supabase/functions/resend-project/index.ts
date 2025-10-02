import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const formData = await req.formData();
    const projectId = formData.get('projectId') as string;
    const videoFile = formData.get('videoFile') as File;
    const message = formData.get('message') as string;

    if (!projectId || !videoFile) {
      throw new Error('Missing required fields: projectId and videoFile');
    }

    console.log('Reenvio de projeto iniciado:', { projectId, userId: user.id });

    // Get project info
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found');
    }

    // Upload new video to storage
    const fileName = `${projectId}/${Date.now()}-${videoFile.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audiovisual-projects')
      .upload(fileName, videoFile, {
        contentType: videoFile.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Erro ao fazer upload do vídeo:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('audiovisual-projects')
      .getPublicUrl(fileName);

    console.log('Novo vídeo carregado:', publicUrl);

    // Update project with new video and status
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        video_url: publicUrl,
        status: 'in-revision',
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (updateError) {
      console.error('Erro ao atualizar projeto:', updateError);
      throw updateError;
    }

    // Reset all feedback resolved status
    const { error: feedbackResetError } = await supabase
      .from('project_feedback')
      .update({ resolved: false, resolved_at: null })
      .in('keyframe_id', 
        supabase
          .from('project_keyframes')
          .select('id')
          .eq('project_id', projectId)
      );

    if (feedbackResetError) {
      console.error('Erro ao resetar feedback:', feedbackResetError);
    }

    // Create notification for team
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: project.user_id,
        type: 'video_resent',
        title: 'Vídeo Corrigido Reenviado',
        message: message || `O projeto "${project.title}" foi corrigido e o vídeo foi atualizado`,
        project_id: projectId,
        metadata: {
          project_title: project.title,
          client: project.client,
          resent_by: user.id
        }
      });

    if (notifError) {
      console.error('Erro ao criar notificação:', notifError);
    }

    console.log('Projeto reenviado com sucesso:', projectId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        projectId,
        newVideoUrl: publicUrl,
        shareUrl: `${req.headers.get('origin')}/aprovacao/${project.share_id}`
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Erro na função resend-project:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});