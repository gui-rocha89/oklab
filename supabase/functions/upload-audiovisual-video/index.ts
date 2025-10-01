import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const formData = await req.formData()
    const projectId = formData.get('projectId') as string
    const videoFile = formData.get('video') as File
    
    if (!projectId || !videoFile) {
      throw new Error('Missing required fields')
    }

    console.log(`[Upload] Starting background upload for project ${projectId}`)

    // Background task for video upload
    const uploadTask = async () => {
      try {
        const fileName = `${projectId}/${Date.now()}.${videoFile.name.split('.').pop()}`
        
        // Upload video to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('audiovisual-projects')
          .upload(fileName, videoFile, {
            contentType: videoFile.type,
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('[Upload] Error:', uploadError)
          // Update project status to error
          await supabase
            .from('projects')
            .update({ status: 'error' })
            .eq('id', projectId)
          return
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('audiovisual-projects')
          .getPublicUrl(fileName)

        // Update project with video URL
        const { error: updateError } = await supabase
          .from('projects')
          .update({ 
            video_url: publicUrl,
            status: 'pending'
          })
          .eq('id', projectId)

        if (updateError) {
          console.error('[Upload] Update error:', updateError)
        } else {
          console.log(`[Upload] Success for project ${projectId}`)
        }
      } catch (error) {
        console.error('[Upload] Background task error:', error)
      }
    }

    // Start background upload without awaiting
    EdgeRuntime.waitUntil(uploadTask())

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Upload started in background'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('[Upload] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
