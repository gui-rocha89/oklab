import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Attachment {
  id: string
  name: string
  url: string
  type: string
  mimeType: string
  size: number
  uploadedAt: string
}

interface KeyframeComment {
  id: string
  time: number
  comment: string
  attachments?: Attachment[]
}

interface RequestBody {
  shareId: string
  status: string
  rating?: number
  clientName?: string
  clientEmail?: string
  keyframes?: KeyframeComment[]
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { shareId, status, rating, clientName, clientEmail, keyframes }: RequestBody = await req.json()

    console.log('[complete-project] Received request:', { shareId, status, rating, clientName, clientEmail, keyframesCount: keyframes?.length })

    // Validate input
    if (!shareId || !status) {
      console.error('[complete-project] Missing required fields')
      return new Response(
        JSON.stringify({ error: 'shareId and status are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('[complete-project] Fetching project with share_id:', shareId)

    // Find project by share_id
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('id, completed_at, status, user_id')
      .eq('share_id', shareId)
      .single()

    if (fetchError || !project) {
      console.error('[complete-project] Project not found:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[complete-project] Found project:', { id: project.id, completed_at: project.completed_at })

    // Check if already completed
    if (project.completed_at) {
      console.log('[complete-project] Project already completed at:', project.completed_at)
      return new Response(
        JSON.stringify({ error: 'Project already completed', completed_at: project.completed_at }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Save keyframe feedbacks if provided
    if (keyframes && keyframes.length > 0) {
      console.log('[complete-project] Saving', keyframes.length, 'keyframe feedbacks')
      
      for (const kf of keyframes.filter(k => k.comment.trim() !== '')) {
        const minutes = Math.floor(kf.time / 60)
        const seconds = kf.time % 60
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`
        
        // Prepare keyframe attachments with timestamp
        const keyframeAttachments = [{
          type: 'timestamp',
          time: kf.time,
          timeStr: timeStr
        }]
        
        // Create new keyframe with client comment
        const { data: newKeyframe, error: kfError } = await supabase
          .from('project_keyframes')
          .insert({
            project_id: project.id,
            title: kf.comment, // Save client comment directly in title
            status: 'pending',
            attachments: keyframeAttachments
          })
          .select()
          .single()
        
        if (kfError || !newKeyframe) {
          console.error('[complete-project] Error creating keyframe:', kfError)
          continue
        }
        
        console.log('[complete-project] Saved keyframe feedback at', timeStr)
        
        // Always create feedback record, with or without attachments
        const feedbackAttachments = kf.attachments && kf.attachments.length > 0 
          ? kf.attachments 
          : []
        
        console.log('[complete-project] Creating feedback with', feedbackAttachments.length, 'attachments')
        
        const { error: feedbackError } = await supabase
          .from('project_feedback')
          .insert({
            keyframe_id: newKeyframe.id,
            user_id: project.user_id,
            comment: kf.comment,
            x_position: 0,
            y_position: 0,
            status: 'pending',
            attachments: feedbackAttachments
          })
        
        if (feedbackError) {
          console.error('[complete-project] Error saving feedback:', feedbackError)
        } else {
          console.log('[complete-project] Feedback saved successfully')
        }
      }
      
      console.log('[complete-project] All keyframe feedbacks saved')
    }

    const now = new Date().toISOString()
    
    // Determine automatic status based on feedback presence
    const hasKeyframesWithFeedback = keyframes && keyframes.length > 0 && keyframes.some(k => k.comment.trim() !== '')
    const automaticStatus = hasKeyframesWithFeedback ? 'feedback-sent' : 'approved'
    
    console.log('[complete-project] Updating project:', { 
      id: project.id, 
      originalStatus: status, 
      automaticStatus,
      hasKeyframesWithFeedback,
      completed_at: now 
    })

    // Update project with completed_at and automatic status
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update({
        completed_at: now,
        status: automaticStatus,
        approval_date: automaticStatus === 'approved' ? now : null
      })
      .eq('id', project.id)
      .select()
      .single()

    if (updateError) {
      console.error('[complete-project] Update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update project', details: updateError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[complete-project] Project updated successfully:', updatedProject)

    // If rating is provided, save it to platform_reviews
    if (rating && clientEmail) {
      console.log('[complete-project] Saving platform review')
      
      const { error: reviewError } = await supabase
        .from('platform_reviews')
        .insert({
          project_id: project.id,
          rating: rating,
          client_name: clientName,
          client_email: clientEmail
        })

      if (reviewError) {
        console.error('[complete-project] Failed to save review:', reviewError)
        // Don't fail the entire request if review save fails
      } else {
        console.log('[complete-project] Review saved successfully')
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        completed_at: now,
        project: updatedProject
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[complete-project] Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
