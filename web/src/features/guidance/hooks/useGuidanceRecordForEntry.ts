// Query hook for the motivational guidance record generated for a
// specific confession entry (if one exists yet). Mirrors
// useReadingPlanForEntry's pattern for the guidance_records table.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';

export interface GuidanceRecord {
  id: string;
  confession_entry_id: string;
  content: string;
  created_at: string;
}

export function useGuidanceRecordForEntry(confessionEntryId: string | undefined) {
  return useQuery({
    queryKey: ['guidance-record', confessionEntryId],
    enabled: !!confessionEntryId,
    queryFn: async (): Promise<GuidanceRecord | null> => {
      const { data, error } = await supabase
        .from('guidance_records')
        .select('id, confession_entry_id, content, created_at')
        .eq('confession_entry_id', confessionEntryId as string)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as GuidanceRecord | null;
    },
  });
}
