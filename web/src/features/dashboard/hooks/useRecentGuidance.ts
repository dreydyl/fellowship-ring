// Query hook for fetching the current user's most recent recovery
// guidance records for display on the dashboard.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../auth/AuthProvider';

export interface GuidanceRecordSummary {
  id: string;
  confession_entry_id: string;
  content: string;
  created_at: string;
}

export function useRecentGuidance(limit = 5) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recent-guidance', user?.id, limit],
    enabled: !!user,
    queryFn: async (): Promise<GuidanceRecordSummary[]> => {
      const { data, error } = await supabase
        .from('guidance_records')
        .select('id, confession_entry_id, content, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
}
