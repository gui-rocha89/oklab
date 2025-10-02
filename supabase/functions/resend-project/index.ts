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

    // Parse JSON body (não mais FormData - upload é feito no frontend)
    const { projectId, videoUrl, message } = await req.json();

    if (!projectId || !videoUrl) {
      throw new Error('Missing required fields: projectId and videoUrl');
    }

    console.log('📦 Reenvio de projeto iniciado (metadata-only):', { 
      projectId, 
      userId: user.id,
      videoUrl
    });

    // Get project info
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found');
    }

    // Verify user has permission
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isManager = userRole?.role === 'supreme_admin' || userRole?.role === 'manager';
    
    if (project.user_id !== user.id && !isManager) {
      throw new Error('No permission to resend this project');
    }

    // Generate new share_id for each resend to invalidate old links
    const newShareId = `av-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    const currentRound = project.current_feedback_round || 1;
    const nextRound = currentRound + 1;
    
    // Update project with new video, new share_id, status, resent_at and increment feedback round
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        video_url: videoUrl,
        share_id: newShareId,
        status: 'in-revision',
        completed_at: null,
        current_feedback_round: nextRound,
        resent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (updateError) {
      console.error('❌ Erro ao atualizar projeto:', updateError);
      throw updateError;
    }

    console.log('✅ Projeto atualizado - Rodada:', nextRound);

    // Get all keyframes for this project
    const { data: keyframes } = await supabase
      .from('project_keyframes')
      .select('id')
      .eq('project_id', projectId);

    // Mark ALL feedbacks from the PREVIOUS round as resolved
    // This includes both feedbacks with team responses AND implicit approvals
    if (keyframes && keyframes.length > 0) {
      const keyframeIds = keyframes.map(k => k.id);
      
      const { error: resolveError } = await supabase
        .from('project_feedback')
        .update({ 
          resolved: true, 
          resolved_at: new Date().toISOString() 
        })
        .in('keyframe_id', keyframeIds)
        .eq('feedback_round', currentRound); // Only feedbacks from the PREVIOUS round

      if (resolveError) {
        console.error('❌ Erro ao marcar feedbacks como resolvidos:', resolveError);
      } else {
        console.log(`✅ Feedbacks da rodada ${currentRound} marcados como resolvidos`);
      }

      // Also update creative_approvals from the previous round
      const { error: approvalsError } = await supabase
        .from('creative_approvals')
        .update({ updated_at: new Date().toISOString() })
        .in('keyframe_id', keyframeIds)
        .eq('feedback_round', currentRound);

      if (approvalsError) {
        console.error('❌ Erro ao atualizar aprovações:', approvalsError);
      }
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
      console.error('❌ Erro ao criar notificação:', notifError);
    } else {
      console.log('✅ Notificação criada');
    }

    // Generate share URL with NEW share_id
    const baseUrl = 'https://817d038c-18c1-4aa7-95dd-26a14d1a02ea.lovableproject.com';
    const shareUrl = `${baseUrl}/aprovacao-audiovisual/${newShareId}`;

    console.log('🎉 Reenvio concluído com sucesso:', { shareUrl, newShareId });

    return new Response(
      JSON.stringify({ 
        success: true, 
        projectId,
        newVideoUrl: videoUrl,
        newShareId,
        shareUrl
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ Erro na função resend-project:', error);
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
