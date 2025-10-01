import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteSummary {
  success: boolean;
  projectId: string;
  deletedItems: {
    feedbacks: number;
    annotations: number;
    reviews: number;
    downloads: number;
    approvals: number;
    keyframes: number;
    storageFiles: number;
  };
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
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
      throw new Error('Não autorizado - Token ausente');
    }

    // Verify user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Não autorizado - Token inválido');
    }

    // Get project ID from request
    const { projectId } = await req.json();
    
    if (!projectId) {
      throw new Error('ID do projeto é obrigatório');
    }

    console.log(`🗑️ Iniciando exclusão do projeto ${projectId} pelo usuário ${user.id}`);

    // Check if project exists and user has permission
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id, video_url')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new Error('Projeto não encontrado');
    }

    // Check user role
    const { data: userRole } = await supabase
      .rpc('get_user_role', { user_id: user.id });

    const isOwner = project.user_id === user.id;
    const isManager = userRole === 'supreme_admin' || userRole === 'manager';

    if (!isOwner && !isManager) {
      throw new Error('Você não tem permissão para excluir este projeto');
    }

    console.log(`✅ Permissão verificada - Prosseguindo com exclusão`);

    // Initialize deletion summary
    const summary: DeleteSummary = {
      success: false,
      projectId,
      deletedItems: {
        feedbacks: 0,
        annotations: 0,
        reviews: 0,
        downloads: 0,
        approvals: 0,
        keyframes: 0,
        storageFiles: 0,
      }
    };

    // Get all keyframe IDs for this project
    const { data: keyframes } = await supabase
      .from('project_keyframes')
      .select('id')
      .eq('project_id', projectId);

    const keyframeIds = keyframes?.map(kf => kf.id) || [];
    console.log(`📋 Encontrados ${keyframeIds.length} keyframes`);

    // 1. Delete feedbacks (related to keyframes)
    if (keyframeIds.length > 0) {
      const { error: feedbackError, count: feedbackCount } = await supabase
        .from('project_feedback')
        .delete({ count: 'exact' })
        .in('keyframe_id', keyframeIds);

      if (feedbackError) {
        console.error('Erro ao excluir feedbacks:', feedbackError);
      } else {
        summary.deletedItems.feedbacks = feedbackCount || 0;
        console.log(`✅ Excluídos ${feedbackCount} feedbacks`);
      }

      // 2. Delete creative approvals (related to keyframes)
      const { error: approvalsError, count: approvalsCount } = await supabase
        .from('creative_approvals')
        .delete({ count: 'exact' })
        .in('keyframe_id', keyframeIds);

      if (approvalsError) {
        console.error('Erro ao excluir aprovações:', approvalsError);
      } else {
        summary.deletedItems.approvals = approvalsCount || 0;
        console.log(`✅ Excluídas ${approvalsCount} aprovações`);
      }
    }

    // 3. Delete video annotations
    const { error: annotationsError, count: annotationsCount } = await supabase
      .from('video_annotations')
      .delete({ count: 'exact' })
      .eq('project_id', projectId);

    if (annotationsError) {
      console.error('Erro ao excluir anotações:', annotationsError);
    } else {
      summary.deletedItems.annotations = annotationsCount || 0;
      console.log(`✅ Excluídas ${annotationsCount} anotações`);
    }

    // 4. Delete platform reviews
    const { error: reviewsError, count: reviewsCount } = await supabase
      .from('platform_reviews')
      .delete({ count: 'exact' })
      .eq('project_id', projectId);

    if (reviewsError) {
      console.error('Erro ao excluir reviews:', reviewsError);
    } else {
      summary.deletedItems.reviews = reviewsCount || 0;
      console.log(`✅ Excluídos ${reviewsCount} reviews`);
    }

    // 5. Delete download records
    const { error: downloadsError, count: downloadsCount } = await supabase
      .from('project_downloads')
      .delete({ count: 'exact' })
      .eq('project_id', projectId);

    if (downloadsError) {
      console.error('Erro ao excluir downloads:', downloadsError);
    } else {
      summary.deletedItems.downloads = downloadsCount || 0;
      console.log(`✅ Excluídos ${downloadsCount} registros de download`);
    }

    // 6. Delete keyframes
    const { error: keyframesError, count: keyframesCount } = await supabase
      .from('project_keyframes')
      .delete({ count: 'exact' })
      .eq('project_id', projectId);

    if (keyframesError) {
      console.error('Erro ao excluir keyframes:', keyframesError);
    } else {
      summary.deletedItems.keyframes = keyframesCount || 0;
      console.log(`✅ Excluídos ${keyframesCount} keyframes`);
    }

    // 7. Delete storage files and folder (if video_url exists)
    if (project.video_url) {
      try {
        // Extract folder path from URL
        // URL format: https://[project].supabase.co/storage/v1/object/public/audiovisual-projects/[FOLDER_ID]/[FILENAME]
        const match = project.video_url.match(/audiovisual-projects\/([^\/]+)\//);
        
        if (match && match[1]) {
          const folderId = match[1];
          console.log(`📁 Removendo pasta do Storage: ${folderId}`);
          
          // List all files in this folder
          const { data: folderFiles, error: listError } = await supabase.storage
            .from('audiovisual-projects')
            .list(folderId);

          if (listError) {
            console.error('Erro ao listar arquivos da pasta:', listError);
          } else if (folderFiles && folderFiles.length > 0) {
            // Delete all files in the folder
            const filePaths = folderFiles.map(f => `${folderId}/${f.name}`);
            
            const { error: storageError } = await supabase.storage
              .from('audiovisual-projects')
              .remove(filePaths);

            if (storageError) {
              console.error('Erro ao excluir arquivos do Storage:', storageError);
            } else {
              summary.deletedItems.storageFiles = filePaths.length;
              console.log(`✅ Excluídos ${filePaths.length} arquivos do Storage na pasta ${folderId}`);
            }
          }
        } else {
          console.warn('⚠️ Formato de URL inválido, não foi possível extrair pasta:', project.video_url);
        }
      } catch (storageErr) {
        console.error('Erro ao processar exclusão do Storage:', storageErr);
      }
    }

    // 8. Finally, delete the project itself
    const { error: projectDeleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (projectDeleteError) {
      throw new Error(`Erro ao excluir projeto: ${projectDeleteError.message}`);
    }

    summary.success = true;
    console.log('🎉 Projeto excluído com sucesso!');
    console.log('📊 Resumo:', JSON.stringify(summary.deletedItems, null, 2));

    return new Response(
      JSON.stringify(summary),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Erro na exclusão do projeto:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Erro desconhecido ao excluir projeto',
        projectId: null,
        deletedItems: null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
