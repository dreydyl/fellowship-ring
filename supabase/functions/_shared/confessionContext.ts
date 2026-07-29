// Shared context builder for Gloo AI prompt-driven edge functions.
//
// Loads everything the various prompt builders (desperation,
// reading-plan, motivational, guided-prayer, severity-recommendation)
// need in a single place, so each edge function does one round-trip
// through this helper instead of duplicating queries.

import { createSupabaseAdminClient } from './supabaseAdmin.ts';

export interface ConfessionEntrySummary {
  content: string;
  urgeIntensity: number;
  createdAt: string;
}

export interface ConfessionContext {
  entry: {
    id: string;
    content: string;
    urgeIntensity: number;
    createdAt: string;
  };
  last7Entries: ConfessionEntrySummary[];
  last3Entries: ConfessionEntrySummary[];
  gender: 'brother' | 'sister' | null;
  selfReportedSeverity: { level: number; since: string } | null;
}

/**
 * Builds the shared context used by all Gloo AI prompt builders for a
 * given confession entry. Throws if the entry doesn't exist or doesn't
 * belong to `userId`.
 */
export async function buildConfessionContext(
  userId: string,
  entryId: string,
): Promise<ConfessionContext> {
  const supabase = createSupabaseAdminClient();

  const { data: entry, error: entryError } = await supabase
    .from('confession_entries')
    .select('id, content, urge_intensity, created_at')
    .eq('id', entryId)
    .eq('user_id', userId)
    .single();

  if (entryError || !entry) {
    throw new Error('Confession entry not found');
  }

  const { data: recentEntries, error: recentError } = await supabase
    .from('confession_entries')
    .select('content, urge_intensity, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(7);

  if (recentError) throw recentError;

  const last7Entries: ConfessionEntrySummary[] = (recentEntries ?? []).map((row) => ({
    content: row.content,
    urgeIntensity: row.urge_intensity,
    createdAt: row.created_at,
  }));
  const last3Entries = last7Entries.slice(0, 3);

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('gender')
    .eq('user_id', userId)
    .maybeSingle();

  if (profileError) throw profileError;

  const gender: ConfessionContext['gender'] =
    profile?.gender === 'male' ? 'brother' : profile?.gender === 'female' ? 'sister' : null;

  const { data: latestSelfReport, error: selfReportError } = await supabase
    .from('addiction_assessments')
    .select('severity_level, created_at')
    .eq('user_id', userId)
    .eq('source', 'self_report')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selfReportError) throw selfReportError;

  const selfReportedSeverity = latestSelfReport
    ? { level: latestSelfReport.severity_level, since: latestSelfReport.created_at }
    : null;

  return {
    entry: {
      id: entry.id,
      content: entry.content,
      urgeIntensity: entry.urge_intensity,
      createdAt: entry.created_at,
    },
    last7Entries,
    last3Entries,
    gender,
    selfReportedSeverity,
  };
}
