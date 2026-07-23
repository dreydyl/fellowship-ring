// Mutation hook for submitting a self-reported addiction severity level.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../auth/AuthProvider';

export interface SelfReportInput {
  severityLevel: number;
  addictionType?: string;
}

export function useSubmitSelfReport() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ severityLevel, addictionType }: SelfReportInput) => {
      if (!user) throw new Error('You must be signed in to submit an assessment.');

      const { data, error } = await supabase
        .from('addiction_assessments')
        .insert({
          user_id: user.id,
          source: 'self_report',
          severity_level: severityLevel,
          addiction_type: addictionType || null,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Keep the user's profile in sync with their latest self-report so
      // it can be used to pre-populate this form next time and as the
      // current-state lookup for AI-generated guidance/plans/prayers.
      const { error: profileError } = await supabase.from('profiles').upsert({
        user_id: user.id,
        current_severity_level: severityLevel,
        current_addiction_type: addictionType || null,
        updated_at: new Date().toISOString(),
      });

      if (profileError) throw profileError;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addiction-assessments', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
}
