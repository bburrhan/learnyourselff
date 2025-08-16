import { corsHeaders } from '../_shared/cors.ts'

const corsOptions = {
  ...corsHeaders,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsOptions })
  }

  try {
    const { purchaseId } = await req.json()

    // In a real implementation, you would:
    // 1. Verify the purchase exists and belongs to the user
    // 2. Generate a secure, time-limited download URL
    // 3. Update the download count in the database
    // 4. Return the download URL

    // Mock response for demo purposes
    const mockDownloadUrl = 'https://example.com/secure-download/' + purchaseId
    
    return new Response(
      JSON.stringify({
        downloadUrl: mockDownloadUrl,
        message: 'Download URL generated successfully'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsOptions,
        },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message
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