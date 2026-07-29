// Query hook for the current user's profile, which tracks their
// current addiction severity level and struggle note (distinct from
// the historical addiction_assessments log). Used to pre-populate the
// self-report form and by AI features as the current-state lookup.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../auth/AuthProvider';

export interface Profile {
  user_id: string;
  current_severity_level: number | null;
  current_addiction_type: string | null;
  gender: 'male' | 'female' | 'none' | null;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, current_severity_level, current_addiction_type, gender, updated_at')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}
