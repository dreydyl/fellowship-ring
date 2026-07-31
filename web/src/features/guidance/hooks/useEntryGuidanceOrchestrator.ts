// Entry-save orchestrator hook.
//
// Calls the generate-entry-guidance edge function, which builds the
// shared ConfessionContext once server-side and fans out across
// assess-desperation, generate-reading-plan, generate-motivational,
// recommend-severity (concurrently), then kicks off
// generate-guided-prayer as soon as assess-desperation resolves.
//
// The edge function streams back newline-delimited JSON progress
// events as each task settles, which this hook parses incrementally so
// callers can render independent per-card loading states instead of
// waiting for the whole batch.

import { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';
import type { ReadingPlan } from './useReadingPlanForEntry';
import type { GuidanceRecord } from './useGuidanceRecordForEntry';
import type { GuidedPrayer } from './useGuidedPrayerForEntry';
import { pendingSeverityRecommendationKey } from './usePendingSeverityRecommendation';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;

export type GuidanceTarget = 'desperation' | 'readingPlan' | 'motivational' | 'severity' | 'guidedPrayer';
// 'disregarded' means the server determined the entry isn't actually a
// confession/journal entry (desperationLevel === 0) and skipped
// generating this card entirely — see `message` for the fallback copy.
export type GuidanceStatus = 'idle' | 'loading' | 'success' | 'error' | 'disregarded';

export interface GuidanceCardState<T> {
  status: GuidanceStatus;
  data?: T;
  error?: string;
  message?: string;
}

export interface DesperationResult {
  desperationLevel: number;
}

export interface SeverityResult {
  recommendedSeverity: number;
}

export interface EntryGuidanceState {
  desperation: GuidanceCardState<DesperationResult>;
  readingPlan: GuidanceCardState<ReadingPlan>;
  motivational: GuidanceCardState<GuidanceRecord>;
  severity: GuidanceCardState<SeverityResult>;
  guidedPrayer: GuidanceCardState<GuidedPrayer>;
}

const idleState: EntryGuidanceState = {
  desperation: { status: 'idle' },
  readingPlan: { status: 'idle' },
  motivational: { status: 'idle' },
  severity: { status: 'idle' },
  guidedPrayer: { status: 'idle' },
};

interface GuidanceEvent {
  target: GuidanceTarget;
  status: GuidanceStatus;
  data?: unknown;
  error?: string;
  message?: string;
}

export function useEntryGuidanceOrchestrator() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<EntryGuidanceState>(idleState);
  const runIdRef = useRef(0);

  const trigger = useCallback(
    async (confessionEntryId: string) => {
      const runId = ++runIdRef.current;

      setState({
        desperation: { status: 'loading' },
        readingPlan: { status: 'loading' },
        motivational: { status: 'loading' },
        severity: { status: 'loading' },
        guidedPrayer: { status: 'idle' },
      });

      const applyEvent = (event: GuidanceEvent) => {
        if (runId !== runIdRef.current) return;
        setState((prev) => ({
          ...prev,
          [event.target]: {
            status: event.status,
            data: event.data,
            error: event.error,
            message: event.message,
          },
        }));

        if (event.status === 'success') {
          if (event.target === 'readingPlan') {
            queryClient.invalidateQueries({ queryKey: ['reading-plan', confessionEntryId] });
          } else if (event.target === 'motivational') {
            queryClient.invalidateQueries({ queryKey: ['guidance-record', confessionEntryId] });
          } else if (event.target === 'guidedPrayer') {
            queryClient.invalidateQueries({ queryKey: ['guided-prayer', confessionEntryId] });
          } else if (event.target === 'severity') {
            // Stash the not-yet-recorded recommendation in the query
            // cache (see usePendingSeverityRecommendation) so it keeps
            // showing if the user navigates away and back before
            // accepting/dismissing it, without persisting it server-side.
            queryClient.setQueryData(
              pendingSeverityRecommendationKey(confessionEntryId),
              event.data,
            );
          }
        }
      };

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const response = await fetch(`${supabaseUrl}/functions/v1/generate-entry-guidance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({ confessionEntryId }),
        });

        if (!response.ok || !response.body) {
          const data = await response.json().catch(() => null);
          const message = data?.error || `Edge function failed (${response.status})`;
          (['desperation', 'readingPlan', 'motivational', 'severity', 'guidedPrayer'] as const).forEach(
            (target) => applyEvent({ target, status: 'error', error: message }),
          );
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (runId !== runIdRef.current) return;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.trim()) continue;
            applyEvent(JSON.parse(line) as GuidanceEvent);
          }
        }

        if (buffer.trim()) {
          applyEvent(JSON.parse(buffer) as GuidanceEvent);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate guidance.';
        (['desperation', 'readingPlan', 'motivational', 'severity', 'guidedPrayer'] as const).forEach(
          (target) => applyEvent({ target, status: 'error', error: message }),
        );
      }
    },
    [queryClient],
  );

  return { state, trigger };
}
