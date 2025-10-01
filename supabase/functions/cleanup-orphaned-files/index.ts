import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CleanupResult {
  success: boolean;
  totalFiles: number;
  orphanedFiles: number;
  deletedFiles: string[];
  errors: string[];
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

    console.log('🧹 Iniciando limpeza de arquivos órfãos...');

    // Get all files from audiovisual-projects bucket
    const { data: files, error: listError } = await supabase.storage
      .from('audiovisual-projects')
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      throw new Error(`Erro ao listar arquivos: ${listError.message}`);
    }

    console.log(`📁 Total de pastas encontradas: ${files?.length || 0}`);

    // Get all projects with video URLs
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('video_url');

    if (projectsError) {
      throw new Error(`Erro ao buscar projetos: ${projectsError.message}`);
    }

    // Extract folder names from project video URLs
    const activeFolders = new Set<string>();
    projects?.forEach(project => {
      if (project.video_url) {
        // Extract folder ID from URL
        // Format: https://[...]/audiovisual-projects/[FOLDER_ID]/[FILENAME]
        const match = project.video_url.match(/audiovisual-projects\/([^\/]+)\//);
        if (match && match[1]) {
          activeFolders.add(match[1]);
        }
      }
    });

    console.log(`✅ Pastas ativas (com projetos): ${activeFolders.size}`);
    console.log(`📋 Pastas ativas: ${Array.from(activeFolders).join(', ')}`);

    // Find orphaned folders
    const orphanedFolders: string[] = [];
    files?.forEach(file => {
      if (file.name && !activeFolders.has(file.name)) {
        orphanedFolders.push(file.name);
      }
    });

    console.log(`🗑️ Pastas órfãs encontradas: ${orphanedFolders.length}`);

    const result: CleanupResult = {
      success: true,
      totalFiles: files?.length || 0,
      orphanedFiles: orphanedFolders.length,
      deletedFiles: [],
      errors: []
    };

    // Delete orphaned folders and their contents
    for (const folderName of orphanedFolders) {
      try {
        console.log(`🗑️ Removendo pasta órfã: ${folderName}`);
        
        // List all files in this folder
        const { data: folderFiles, error: folderListError } = await supabase.storage
          .from('audiovisual-projects')
          .list(folderName);

        if (folderListError) {
          console.error(`Erro ao listar arquivos da pasta ${folderName}:`, folderListError);
          result.errors.push(`Pasta ${folderName}: ${folderListError.message}`);
          continue;
        }

        // Delete each file in the folder
        const filesToDelete = folderFiles?.map(f => `${folderName}/${f.name}`) || [];
        
        if (filesToDelete.length > 0) {
          const { error: deleteError } = await supabase.storage
            .from('audiovisual-projects')
            .remove(filesToDelete);

          if (deleteError) {
            console.error(`Erro ao remover arquivos da pasta ${folderName}:`, deleteError);
            result.errors.push(`Pasta ${folderName}: ${deleteError.message}`);
          } else {
            console.log(`✅ Removidos ${filesToDelete.length} arquivos da pasta ${folderName}`);
            result.deletedFiles.push(...filesToDelete);
          }
        }

      } catch (error: any) {
        console.error(`Erro ao processar pasta ${folderName}:`, error);
        result.errors.push(`Pasta ${folderName}: ${error.message}`);
      }
    }

    console.log('✅ Limpeza concluída!');
    console.log(`📊 Arquivos removidos: ${result.deletedFiles.length}`);
    console.log(`❌ Erros: ${result.errors.length}`);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Erro desconhecido na limpeza',
        totalFiles: 0,
        orphanedFiles: 0,
        deletedFiles: [],
        errors: [error.message]
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
