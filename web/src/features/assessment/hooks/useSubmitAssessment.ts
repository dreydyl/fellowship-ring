// Mutation hook for recording an addiction_assessments row — either
// accepting an AI severity recommendation as-is (source: 'ai') or the
// user overriding it with their own number (source: 'self_report').
// Either way, profiles.current_severity_level is kept in sync, same
// as useSubmitSelfReport does for the standalone self-report form.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../auth/AuthProvider';

export interface SubmitAssessmentInput {
  severityLevel: number;
  source: 'ai' | 'self_report';
  basedOnEntryId?: string;
}

export function useSubmitAssessment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ severityLevel, source, basedOnEntryId }: SubmitAssessmentInput) => {
      if (!user) throw new Error('You must be signed in to record an assessment.');

      const { data, error } = await supabase
        .from('addiction_assessments')
        .insert({
          user_id: user.id,
          source,
          severity_level: severityLevel,
          based_on_entry_id: basedOnEntryId || null,
        })
        .select('id, source, severity_level, based_on_entry_id, created_at')
        .single();

      if (error) throw error;

      const { error: profileError } = await supabase.from('profiles').upsert({
        user_id: user.id,
        current_severity_level: severityLevel,
        updated_at: new Date().toISOString(),
      });

      if (profileError) throw profileError;

      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addiction-assessments', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      if (variables.basedOnEntryId) {
        queryClient.invalidateQueries({
          queryKey: ['assessment-for-entry', variables.basedOnEntryId],
        });
      }
    },
  });
}
