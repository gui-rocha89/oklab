import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReviewSubmission {
  project_id: string;
  rating: number;
  client_name?: string;
  client_email?: string;
  comment?: string;
}

// In-memory rate limiting (resets on function restart)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // Max 5 submissions per IP
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour window

function checkRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(clientIp);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

function validateInput(data: ReviewSubmission): { valid: boolean; error?: string } {
  // Validate rating
  if (!data.rating || data.rating < 1 || data.rating > 5) {
    return { valid: false, error: 'Rating must be between 1 and 5' };
  }

  // Validate project_id format
  if (!data.project_id || typeof data.project_id !== 'string') {
    return { valid: false, error: 'Invalid project ID' };
  }

  // Validate and sanitize client_name
  if (data.client_name) {
    if (typeof data.client_name !== 'string' || data.client_name.length > 100) {
      return { valid: false, error: 'Client name must be less than 100 characters' };
    }
    // Remove potentially harmful characters
    data.client_name = data.client_name.trim().replace(/[<>]/g, '');
  }

  // Validate and sanitize email
  if (data.client_email) {
    if (typeof data.client_email !== 'string' || data.client_email.length > 255) {
      return { valid: false, error: 'Email must be less than 255 characters' };
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.client_email)) {
      return { valid: false, error: 'Invalid email format' };
    }
    data.client_email = data.client_email.trim().toLowerCase();
  }

  // Validate and sanitize comment
  if (data.comment) {
    if (typeof data.comment !== 'string' || data.comment.length > 1000) {
      return { valid: false, error: 'Comment must be less than 1000 characters' };
    }
    data.comment = data.comment.trim();
  }

  return { valid: true };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    console.log(`Review submission attempt from IP: ${clientIp}`);

    // Check rate limit
    if (!checkRateLimit(clientIp)) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: 'Too many submissions. Please try again later.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse and validate input
    const data: ReviewSubmission = await req.json();
    const validation = validateInput(data);

    if (!validation.valid) {
      console.warn(`Validation failed: ${validation.error}`);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client with service role for insert
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert the review
    const { error: insertError } = await supabase
      .from('platform_reviews')
      .insert({
        project_id: data.project_id,
        rating: data.rating,
        client_name: data.client_name || 'Cliente Anônimo',
        client_email: data.client_email || 'anonimo@oklab.com',
        comment: data.comment || null,
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save review' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Review submitted successfully for project: ${data.project_id}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Review submitted successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
