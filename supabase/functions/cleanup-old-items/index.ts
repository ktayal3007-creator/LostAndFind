// Edge Function: cleanup-old-items
// Purpose: Automatically delete items older than 6 months (ACTIVE, USER_HISTORY, MAIN_HISTORY)
// Schedule: Daily via cron

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the cleanup function
    const { data, error } = await supabase
      .rpc('cleanup_old_history_items');

    if (error) {
      console.error('Error calling cleanup function:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const result = data && data.length > 0 ? data[0] : {
      deleted_lost_items: 0,
      deleted_found_items: 0,
      deleted_chats: 0
    };

    console.log('Cleanup completed:', result);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cleanup completed successfully',
        result: {
          deletedLostItems: result.deleted_lost_items || 0,
          deletedFoundItems: result.deleted_found_items || 0,
          deletedChats: result.deleted_chats || 0,
          timestamp: new Date().toISOString()
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
