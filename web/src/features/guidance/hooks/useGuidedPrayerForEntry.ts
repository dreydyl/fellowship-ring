// Query hook for the guided prayer generated for a specific confession
// entry (if one exists yet). Mirrors useReadingPlanForEntry's pattern
// for the guided_prayers table.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';

export interface GuidedPrayer {
  id: string;
  confession_entry_id: string;
  content: string;
  desperation_level: number | null;
  created_at: string;
}

export function useGuidedPrayerForEntry(confessionEntryId: string | undefined) {
  return useQuery({
    queryKey: ['guided-prayer', confessionEntryId],
    enabled: !!confessionEntryId,
    queryFn: async (): Promise<GuidedPrayer | null> => {
      const { data, error } = await supabase
        .from('guided_prayers')
        .select('id, confession_entry_id, content, desperation_level, created_at')
        .eq('confession_entry_id', confessionEntryId as string)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as GuidedPrayer | null;
    },
  });
}
