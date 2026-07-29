// TEMPORARY hook for manually inspecting Gloo AI prompt builder output.
// Calls the debug-prompts edge function. Safe to delete once prompt
// tuning/testing is done — not part of the product surface.

import { useMutation } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;

export function useDebugPrompts() {
  return useMutation({
    mutationFn: async (confessionEntryId: string): Promise<unknown> => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(`${supabaseUrl}/functions/v1/debug-prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ confessionEntryId }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || `Edge function failed (${response.status})`);
      }

      return data;
    },
  });
}
