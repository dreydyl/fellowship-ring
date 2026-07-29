// Mutation hook for updating the current user's gender preference on
// their profile. Used by AI prompt builders to select pronouns and
// relational terms (e.g. brother/sister, his/her).

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../auth/AuthProvider';

export type Gender = 'male' | 'female' | 'none';

export function useUpdateGender() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gender: Gender) => {
      if (!user) throw new Error('You must be signed in to update your profile.');

      const { error } = await supabase.from('profiles').upsert({
        user_id: user.id,
        gender,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
}
