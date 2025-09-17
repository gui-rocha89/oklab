import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'Project ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch keyframes data
    const { data: keyframes, error: keyframesError } = await supabase
      .from('project_keyframes')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (keyframesError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch keyframes' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get client IP for logging
    const clientIP = req.headers.get('CF-Connecting-IP') || 
                     req.headers.get('X-Forwarded-For') || 
                     'unknown';

    // Log the download
    const filesDownloaded = [
      { type: 'pdf', name: `Guia_de_Publicacao_${project.client}.pdf` },
      ...(keyframes || []).flatMap(kf => 
        (kf.attachments || []).map(att => ({ type: 'image', name: att.name }))
      )
    ];

    await supabase
      .from('project_downloads')
      .insert({
        project_id: projectId,
        client_ip: clientIP,
        files_downloaded: filesDownloaded
      });

    // Add system feedback log
    if (keyframes && keyframes.length > 0) {
      const currentDate = new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      await supabase
        .from('project_feedback')
        .insert({
          keyframe_id: keyframes[0].id,
          user_id: projectId, // Using project_id as system user
          comment: `Cliente realizou download do Kit Completo em ${currentDate}. Kit contém: ${filesDownloaded.length} arquivos incluindo guia de publicação em PDF.`,
          status: 'system_log',
          x_position: 0,
          y_position: 0
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Download logged successfully',
        filesCount: filesDownloaded.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in generate-delivery-kit function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});