// Edge function: generate-motivational
//
// Given a confession_entry_id, generates a short affirmation +
// exhortation via Gloo AI Completions V2 and stores it in
// guidance_records.
//
// Table decision: reusing guidance_records rather than adding a new
// table. Its shape (user_id, confession_entry_id, content,
// created_at) already fits a short motivational message exactly, and
// "recovery guidance" is a reasonable umbrella for it. assessment_id
// is left null since this isn't tied to a specific assessment.
// Flagging this back per your request — let me know if you'd rather
// split motivational messages into their own table.
//
// Request body: { confessionEntryId: string }
// Requires an Authorization header with the caller's Supabase JWT.

import { createSupabaseAdminClient, getUserIdFromRequest } from '../_shared/supabaseAdmin.ts';
import { buildConfessionContext } from '../_shared/confessionContext.ts';
import { runGenerateMotivational } from '../_shared/tasks/generateMotivational.ts';

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

    let ctx;
    try {
      ctx = await buildConfessionContext(userId, confessionEntryId);
    } catch (error) {
      if (error instanceof Error && error.message === 'Confession entry not found') {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 404,
          headers: { 'content-type': 'application/json' },
        });
      }
      throw error;
    }

    const supabase = createSupabaseAdminClient();
    const guidanceRecord = await runGenerateMotivational(supabase, userId, confessionEntryId, ctx);

    return new Response(JSON.stringify(guidanceRecord), {
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
