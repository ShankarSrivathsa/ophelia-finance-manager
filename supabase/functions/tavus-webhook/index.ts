import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-tavus-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface TavusWebhookPayload {
  video_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  error?: {
    message: string;
    code?: string;
  };
  metadata?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      })
    }

    // Initialize Supabase client with service role key for database updates
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get webhook payload
    const payload: TavusWebhookPayload = await req.json()
    console.log('Received Tavus webhook:', payload)

    // Validate required fields
    if (!payload.video_id || !payload.status) {
      return new Response('Invalid payload: missing video_id or status', {
        status: 400,
        headers: corsHeaders
      })
    }

    // Verify webhook signature (optional but recommended)
    const signature = req.headers.get('x-tavus-signature')
    const webhookSecret = Deno.env.get('TAVUS_WEBHOOK_SECRET')
    
    if (webhookSecret && signature) {
      // Verify the webhook signature
      const body = JSON.stringify(payload)
      const expectedSignature = await generateSignature(body, webhookSecret)
      
      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature')
        return new Response('Unauthorized: Invalid signature', {
          status: 401,
          headers: corsHeaders
        })
      }
    }

    // Prepare update data
    const updateData: any = {
      status: payload.status,
      updated_at: new Date().toISOString()
    }

    // Add optional fields if present
    if (payload.video_url) {
      updateData.video_url = payload.video_url
    }

    if (payload.thumbnail_url) {
      updateData.thumbnail_url = payload.thumbnail_url
    }

    if (payload.duration) {
      updateData.duration = payload.duration
    }

    if (payload.error) {
      updateData.error_message = payload.error.message
      updateData.status = 'failed'
    }

    if (payload.metadata) {
      updateData.metadata = payload.metadata
    }

    // Update the video record in the database
    const { data, error } = await supabaseClient
      .from('generated_videos')
      .update(updateData)
      .eq('video_id', payload.video_id)
      .select()

    if (error) {
      console.error('Database update error:', error)
      return new Response(`Database error: ${error.message}`, {
        status: 500,
        headers: corsHeaders
      })
    }

    if (!data || data.length === 0) {
      console.warn(`No video found with ID: ${payload.video_id}`)
      return new Response('Video not found', {
        status: 404,
        headers: corsHeaders
      })
    }

    console.log('Successfully updated video:', data[0])

    // If video is completed, you could trigger additional actions here
    if (payload.status === 'completed' && payload.video_url) {
      // Optional: Send notification to user, trigger email, etc.
      console.log(`Video ${payload.video_id} completed successfully`)
    }

    // Return success response
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Webhook processed successfully',
      video_id: payload.video_id,
      status: payload.status
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// Helper function to generate HMAC signature for webhook verification
async function generateSignature(body: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const bodyData = encoder.encode(body)
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, bodyData)
  const hashArray = Array.from(new Uint8Array(signature))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return `sha256=${hashHex}`
}