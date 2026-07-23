// Query hook for fetching a single confession entry by id, so users
// can revisit an entry they previously wrote.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';

export interface ConfessionEntry {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function useConfessionEntry(entryId: string | undefined) {
  return useQuery({
    queryKey: ['confession-entry', entryId],
    enabled: !!entryId,
    queryFn: async (): Promise<ConfessionEntry> => {
      const { data, error } = await supabase
        .from('confession_entries')
        .select('id, user_id, content, created_at, updated_at')
        .eq('id', entryId as string)
        .single();

      if (error) throw error;
      return data;
    },
  });
}
