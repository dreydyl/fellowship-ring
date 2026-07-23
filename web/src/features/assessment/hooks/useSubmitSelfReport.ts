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
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addiction-assessments', user?.id] });
    },
  });
}
