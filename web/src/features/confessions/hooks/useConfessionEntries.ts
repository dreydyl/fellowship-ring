// Query key + hook for fetching the current user's confession entry
// history, ordered most-recent first.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../auth/AuthProvider';

export interface ConfessionEntrySummary {
  id: string;
  content: string;
  urge_intensity: number;
  created_at: string;
}

export function useConfessionEntries() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['confession-entries', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<ConfessionEntrySummary[]> => {
      const { data, error } = await supabase
        .from('confession_entries')
        .select('id, content, urge_intensity, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}
