// Mutation hook for creating a new confession entry.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../auth/AuthProvider';

export interface NewConfessionEntryInput {
  content: string;
  urgeIntensity: number;
}

export function useCreateConfessionEntry() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, urgeIntensity }: NewConfessionEntryInput) => {
      if (!user) throw new Error('You must be signed in to write an entry.');

      const { data, error } = await supabase
        .from('confession_entries')
        .insert({ user_id: user.id, content, urge_intensity: urgeIntensity })
        .select('id, content, urge_intensity, created_at')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['confession-entries', user?.id] });
    },
  });
}
