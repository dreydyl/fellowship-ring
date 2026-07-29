// Shared Supabase service-role client for edge functions.
//
// Uses the service role key so functions can read/write across users
// (bypassing RLS) when acting on behalf of the authenticated caller.
// Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, which are
// automatically provided to edge functions by the Supabase runtime.

import { createClient } from 'npm:@supabase/supabase-js@2.45.0';
import type { Database } from '../../types/database.types.ts';

export function createSupabaseAdminClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Resolves the calling user's id from the Authorization header of an
 * incoming edge function request, using the anon client to validate
 * the JWT.
 */
export async function getUserIdFromRequest(req: Request): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) {
    throw new Error('SUPABASE_URL or SUPABASE_ANON_KEY is not set');
  }

  const client = createClient<Database>(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    throw new Error('Unable to resolve user from Authorization header');
  }

  return user.id;
}
