// Query hook for fetching the current user's combined addiction-severity
// history — both self-reported and AI-recommended (accepted) records —
// ordered most-recent first. Powers the Account page's severity timeline
// and SeverityMiniChart.
// See docs/DESIGN.md section 7 ("Account Page").

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../auth/AuthProvider';

export type AssessmentSource = 'self_report' | 'ai';

export interface SeverityHistoryRecord {
  id: string;
  source: AssessmentSource;
  severity_level: number;
  created_at: string;
}

export function useSeverityHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['severity-history', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<SeverityHistoryRecord[]> => {
      const { data, error } = await supabase
        .from('addiction_assessments')
        .select('id, source, severity_level, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}
