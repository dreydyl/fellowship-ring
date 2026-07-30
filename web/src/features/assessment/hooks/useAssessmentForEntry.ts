// Query hook for the addiction assessment recorded against a specific
// confession entry (if the user has accepted or overridden an AI
// severity recommendation for it yet). Mirrors the
// useReadingPlanForEntry / useGuidanceRecordForEntry pattern.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';

export interface EntryAssessment {
  id: string;
  source: 'ai' | 'self_report';
  severity_level: number;
  based_on_entry_id: string | null;
  created_at: string;
}

export function useAssessmentForEntry(confessionEntryId: string | undefined) {
  return useQuery({
    queryKey: ['assessment-for-entry', confessionEntryId],
    enabled: !!confessionEntryId,
    queryFn: async (): Promise<EntryAssessment | null> => {
      const { data, error } = await supabase
        .from('addiction_assessments')
        .select('id, source, severity_level, based_on_entry_id, created_at')
        .eq('based_on_entry_id', confessionEntryId as string)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as EntryAssessment | null;
    },
  });
}
