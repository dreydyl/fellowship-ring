// Edge function: generate-reading-plan
//
// Given a confession_entry_id, loads the entry plus the user's latest
// addiction_assessments row (self-report or AI, whichever is most
// recent), asks Gloo AI to suggest a single relevant Bible passage,
// and inserts the result into reading_plans.
//
// Medium tier: one suggested passage reference (no verse text — that
// is looked up client-side via the YouVersion proxy). Phase 3 will
// upgrade plan_json to a multi-day structure without changing this
// function's inputs.
//
// Request body: { confessionEntryId: string }
// Requires an Authorization header with the caller's Supabase JWT.

import { createSupabaseAdminClient, getUserIdFromRequest } from '../_shared/supabaseAdmin.ts';
import { callGloo } from '../_shared/glooClient.ts';

const SYSTEM_INSTRUCTIONS = `You are a Christian recovery companion helping someone process a confession \
entry and find one relevant Bible passage to reflect on. Respond with ONLY a JSON object \
(no markdown, no code fences) matching this shape:
{
  "title": string, // short plan title, e.g. "Finding Strength in Weakness"
  "description": string, // 1-2 sentence description of why this passage fits
  "reference": string // a single Bible passage reference, e.g. "Philippians 4:12-13"
}
Do not include verse text, only the reference. Keep tone compassionate, non-judgmental, and grounded in scripture.`;

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const userId = await getUserIdFromRequest(req);
    const { confessionEntryId } = await req.json();

    if (!confessionEntryId || typeof confessionEntryId !== 'string') {
      return new Response(JSON.stringify({ error: 'confessionEntryId is required' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const supabase = createSupabaseAdminClient();

    const { data: entry, error: entryError } = await supabase
      .from('confession_entries')
      .select('id, user_id, content, urge_intensity')
      .eq('id', confessionEntryId)
      .eq('user_id', userId)
      .single();

    if (entryError || !entry) {
      return new Response(JSON.stringify({ error: 'Confession entry not found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      });
    }

    const { data: assessment } = await supabase
      .from('addiction_assessments')
      .select('severity_level, addiction_type, notes')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const contextLines = [
      `Confession entry: ${entry.content}`,
      `Urge intensity (1-5): ${entry.urge_intensity}`,
    ];
    if (assessment) {
      contextLines.push(`Current severity level (1-5): ${assessment.severity_level}`);
      if (assessment.addiction_type) {
        contextLines.push(`Struggling with: ${assessment.addiction_type}`);
      }
      if (assessment.notes) {
        contextLines.push(`Assessment notes: ${assessment.notes}`);
      }
    }

    const responseText = await callGloo({
      instructions: SYSTEM_INSTRUCTIONS,
      messages: [{ role: 'user', content: contextLines.join('\n') }],
    });

    let parsed: { title: string; description?: string; reference: string };
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const match = responseText.match(/\{[\s\S]*\}/);
      if (!match) {
        throw new Error(`Gloo AI returned non-JSON response: ${responseText}`);
      }
      parsed = JSON.parse(match[0]);
    }

    const title = typeof parsed.title === 'string' ? parsed.title.trim() : '';
    const reference = typeof parsed.reference === 'string' ? parsed.reference.trim() : '';
    const description = typeof parsed.description === 'string' ? parsed.description : '';

    if (!title || !reference) {
      throw new Error(`Gloo AI response missing required fields: ${responseText}`);
    }

    const { data: plan, error: insertError } = await supabase
      .from('reading_plans')
      .insert({
        user_id: userId,
        confession_entry_id: confessionEntryId,
        title,
        description: description || null,
        plan_json: { version: 1, passages: [{ reference }] },
      })
      .select('id, title, description, plan_json, created_at')
      .single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify(plan), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
});
