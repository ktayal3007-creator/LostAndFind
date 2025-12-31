import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LostItem {
  id: string;
  item_name: string;
  description: string;
  category: string;
  color?: string;
  brand?: string;
  location: string;
  campus: string;
  date_lost: string;
  image_url?: string;
  user_id: string;
}

interface FoundItem {
  id: string;
  item_name: string;
  description: string;
  category: string;
  color?: string;
  brand?: string;
  location: string;
  campus: string;
  date_found: string;
  image_url?: string;
  user_id: string;
}

interface MatchResult {
  similarity_score: number;
  is_match: boolean;
  reason: string;
  actions: {
    send_email: boolean;
    enable_chat: boolean;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== AI Match Items Function Called ===');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { lostItem, foundItem } = await req.json();

    if (!lostItem || !foundItem) {
      throw new Error('Both lostItem and foundItem are required');
    }

    console.log('Lost Item:', lostItem.item_name, '(ID:', lostItem.id, ')');
    console.log('Found Item:', foundItem.item_name, '(ID:', foundItem.id, ')');

    // Build the AI prompt for matching
    const prompt = buildMatchingPrompt(lostItem, foundItem);

    // Call the Large Language Model API
    const matchResult = await callAIMatchingAPI(prompt, lostItem.image_url, foundItem.image_url);

    console.log('Match Result - Score:', matchResult.similarity_score, 'Is Match:', matchResult.is_match);

    // If it's a match (score >= 75), store it in the database
    if (matchResult.is_match) {
      console.log('Match threshold met! Storing in database...');
      
      const { data: existingMatch } = await supabaseClient
        .from('matches')
        .select('id')
        .eq('lost_item_id', lostItem.id)
        .eq('found_item_id', foundItem.id)
        .maybeSingle();

      if (!existingMatch) {
        const { data: match, error: matchError } = await supabaseClient
          .from('matches')
          .insert({
            lost_item_id: lostItem.id,
            found_item_id: foundItem.id,
            similarity_score: matchResult.similarity_score,
            match_reason: matchResult.reason,
            status: 'pending',
          })
          .select()
          .single();

        if (matchError) {
          console.error('Error creating match:', matchError);
        } else {
          // Create notification record
          await supabaseClient
            .from('match_notifications')
            .insert({
              match_id: match.id,
              user_id: lostItem.user_id,
              notification_type: 'in_app',
            });

          // Send email notification (mark for sending)
          await supabaseClient
            .from('match_notifications')
            .insert({
              match_id: match.id,
              user_id: lostItem.user_id,
              notification_type: 'email',
            });
        }
      }
    }

    return new Response(
      JSON.stringify(matchResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in ai-match-items:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

function buildMatchingPrompt(lostItem: LostItem, foundItem: FoundItem): string {
  return `You are an AI-powered Lost & Found Matching Assistant. Your job is to evaluate whether a "found item" matches a previously reported "lost item".

LOST ITEM:
- Title: ${lostItem.item_name}
- Description: ${lostItem.description}
- Category: ${lostItem.category}
- Color: ${lostItem.color || 'Not specified'}
- Brand: ${lostItem.brand || 'Not specified'}
- Location: ${lostItem.location}, ${lostItem.campus}
- Date Lost: ${lostItem.date_lost}
- Has Image: ${lostItem.image_url ? 'Yes' : 'No'}

FOUND ITEM:
- Title: ${foundItem.item_name}
- Description: ${foundItem.description}
- Category: ${foundItem.category}
- Color: ${foundItem.color || 'Not specified'}
- Brand: ${foundItem.brand || 'Not specified'}
- Location: ${foundItem.location}, ${foundItem.campus}
- Date Found: ${foundItem.date_found}
- Has Image: ${foundItem.image_url ? 'Yes' : 'No'}

TASKS:
1. Compare the lost item and found item using semantic similarity.
   - Consider object type, color, brand, shape, size, unique identifiers, location proximity, and time proximity.
   - If images are provided, include visual similarity in the comparison.

2. Calculate a similarity score between 0 and 100.
   - Text similarity (description, title, category): 40%
   - Attribute match (color, brand, location): 30%
   - Time proximity (date lost vs date found): 10%
   - Image similarity (if available): 20%

3. If similarity score ≥ 75%:
   - Mark as a "Potential Match"
   - Generate a short explanation (1–2 sentences) describing why the match is likely

RULES:
- Be conservative. Only mark items as a match if confidence is ≥ 75%.
- Consider location proximity (same campus is better, same building is even better)
- Consider time proximity (found date should be on or after lost date, within reasonable timeframe)
- Look for unique identifiers in descriptions (serial numbers, distinctive marks, etc.)

OUTPUT FORMAT (JSON only, no other text):
{
  "similarity_score": <number 0-100>,
  "is_match": <boolean>,
  "reason": "<1-2 sentence explanation>",
  "actions": {
    "send_email": <boolean>,
    "enable_chat": <boolean>
  }
}`;
}

async function callAIMatchingAPI(
  prompt: string,
  lostItemImageUrl?: string,
  foundItemImageUrl?: string
): Promise<MatchResult> {
  const APP_ID = Deno.env.get('APP_ID');
  const API_URL = 'https://api-integrations.appmedo.com/app-8e6wgm5ndzi9/api-rLob8RdzAOl9/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse';

  console.log('=== AI Matching API Call ===');
  console.log('APP_ID:', APP_ID);
  console.log('Has lost item image:', !!lostItemImageUrl);
  console.log('Has found item image:', !!foundItemImageUrl);

  // Build the parts array for the API request
  const parts: any[] = [{ text: prompt }];

  // Add images if available
  if (lostItemImageUrl) {
    parts.push({
      fileData: {
        mimeType: 'image/jpeg',
        fileUri: lostItemImageUrl,
      },
    });
  }

  if (foundItemImageUrl) {
    parts.push({
      fileData: {
        mimeType: 'image/jpeg',
        fileUri: foundItemImageUrl,
      },
    });
  }

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: parts,
      },
    ],
  };

  try {
    console.log('Sending request to AI API...');
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Id': APP_ID || '',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('API Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error response:', errorText);
      throw new Error(`API request failed: ${response.statusText}`);
    }

    // Parse SSE response
    const text = await response.text();
    const lines = text.split('\n');
    let fullResponse = '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.substring(6));
          if (data.candidates && data.candidates[0]?.content?.parts) {
            for (const part of data.candidates[0].content.parts) {
              if (part.text) {
                fullResponse += part.text;
              }
            }
          }
        } catch (e) {
          // Skip invalid JSON lines
        }
      }
    }

    console.log('AI Full Response:', fullResponse.substring(0, 200) + '...');

    // Extract JSON from response (it might be wrapped in markdown code blocks)
    const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response');
      throw new Error('No valid JSON found in AI response');
    }

    const result: MatchResult = JSON.parse(jsonMatch[0]);
    console.log('Parsed match result:', JSON.stringify(result));

    // Validate the result
    if (typeof result.similarity_score !== 'number' || typeof result.is_match !== 'boolean') {
      throw new Error('Invalid AI response format');
    }

    return result;
  } catch (error) {
    console.error('Error calling AI API:', error);
    // Return a default "no match" result on error
    return {
      similarity_score: 0,
      is_match: false,
      reason: 'Error occurred during matching analysis',
      actions: {
        send_email: false,
        enable_chat: false,
      },
    };
  }
}
