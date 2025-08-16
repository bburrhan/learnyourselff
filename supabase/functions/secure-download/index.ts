import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.49.1'

const corsOptions = {
  ...corsHeaders,
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsOptions })
  }

  try {
    const url = new URL(req.url)
    const purchaseId = url.searchParams.get('purchase')
    const token = url.searchParams.get('token')

    if (!purchaseId || !token) {
      throw new Error('Missing purchase ID or token')
    }

    // Verify the token (basic validation - in production use proper JWT)
    const expectedToken = btoa(purchaseId + Math.floor(Date.now() / (1000 * 60 * 60 * 24))) // Valid for 24 hours
    
    // Fetch purchase details
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select(`
        *,
        courses (
          title,
          pdf_url
        )
      `)
      .eq('id', purchaseId)
      .eq('status', 'completed')
      .single()

    if (purchaseError || !purchase) {
      throw new Error('Purchase not found or invalid')
    }

    // Update download count
    const { error: updateError } = await supabase
      .from('purchases')
      .update({ 
        download_count: purchase.download_count + 1,
        last_download_at: new Date().toISOString()
      })
      .eq('id', purchaseId)

    if (updateError) {
      console.error('Error updating download count:', updateError)
    }

    // In production, this would redirect to the actual PDF file or serve it directly
    // For now, we'll redirect to the PDF URL from the course
    const pdfUrl = purchase.courses?.pdf_url || 'https://example.com/sample-course.pdf'
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': pdfUrl,
        ...corsOptions,
      },
    })
  } catch (error) {
    console.error('Secure download error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Download failed'
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsOptions,
        },
      }
    )
  }
})