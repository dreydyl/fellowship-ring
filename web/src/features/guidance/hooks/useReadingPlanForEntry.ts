// Query hook for the reading plan generated for a specific confession
// entry (if one exists yet).

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';

export interface ReadingPlanPassage {
  number?: number;
  reference: string;
}

export interface ReadingPlanJson {
  version: number;
  passages: ReadingPlanPassage[];
}

export interface ReadingPlan {
  id: string;
  title: string;
  description: string | null;
  plan_json: ReadingPlanJson;
  created_at: string;
}

export function useReadingPlanForEntry(confessionEntryId: string | undefined) {
  return useQuery({
    queryKey: ['reading-plan', confessionEntryId],
    enabled: !!confessionEntryId,
    queryFn: async (): Promise<ReadingPlan | null> => {
      const { data, error } = await supabase
        .from('reading_plans')
        .select('id, title, description, plan_json, created_at')
        .eq('confession_entry_id', confessionEntryId as string)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as ReadingPlan | null;
    },
  });
}
