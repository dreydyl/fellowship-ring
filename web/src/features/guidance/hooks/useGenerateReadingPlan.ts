// Mutation hook that invokes the generate-reading-plan edge function
// for a given confession entry.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';
import type { ReadingPlan } from './useReadingPlanForEntry';

export function useGenerateReadingPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (confessionEntryId: string): Promise<ReadingPlan> => {
      const { data, error } = await supabase.functions.invoke('generate-reading-plan', {
        body: { confessionEntryId },
      });

      if (error) throw error;
      return data as ReadingPlan;
    },
    onSuccess: (_data, confessionEntryId) => {
      queryClient.invalidateQueries({ queryKey: ['reading-plan', confessionEntryId] });
    },
  });
}
