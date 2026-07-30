// Detail page for revisiting a single confession entry.
//
// When navigated to right after saving a new entry (justCreated router
// state), this page automatically kicks off the entry-guidance
// orchestrator (generate-entry-guidance), which runs assess-desperation,
// generate-reading-plan, generate-motivational and recommend-severity
// concurrently, then generate-guided-prayer once desperation resolves.
// Each card below reflects that task's own loading/success/error state
// independently. Revisiting an older entry instead falls back to
// reading whatever was already persisted (plus a manual "Generate
// reading plan" button, kept for entries created before this existed).

import { useEffect, useRef } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Header } from '../../components/Header';
import { useConfessionEntry } from './hooks/useConfessionEntry';
import { useReadingPlanForEntry } from '../guidance/hooks/useReadingPlanForEntry';
import { useGenerateReadingPlan } from '../guidance/hooks/useGenerateReadingPlan';
import { useGuidanceRecordForEntry } from '../guidance/hooks/useGuidanceRecordForEntry';
import { useGuidedPrayerForEntry } from '../guidance/hooks/useGuidedPrayerForEntry';
import { useAssessmentForEntry } from '../assessment/hooks/useAssessmentForEntry';
import {
  useEntryGuidanceOrchestrator,
  type GuidanceStatus,
} from '../guidance/hooks/useEntryGuidanceOrchestrator';
import { ReadingPlanCard } from '../guidance/ReadingPlanCard';
import { SeverityRecommendationCard } from '../guidance/SeverityRecommendationCard';
import { useDebugPrompts } from './hooks/useDebugPrompts';

function GuidanceCard({
  title,
  status,
  error,
  children,
}: {
  title: string;
  status: GuidanceStatus;
  error?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
      {status === 'loading' && <p className="mt-2 text-sm text-gray-500">Generating…</p>}
      {status === 'error' && (
        <p className="mt-2 text-sm text-red-600">{error ?? 'Something went wrong.'}</p>
      )}
      {status === 'success' && children}
      {status === 'idle' && !children && (
        <p className="mt-2 text-sm text-gray-400">Not generated yet.</p>
      )}
    </section>
  );
}

export function EntryDetailPage() {
  const { entryId } = useParams<{ entryId: string }>();
  const location = useLocation();
  const justCreated = Boolean((location.state as { justCreated?: boolean } | null)?.justCreated);

  const { data: entry, isLoading, isError } = useConfessionEntry(entryId);
  const { data: readingPlan, isLoading: isLoadingReadingPlan } = useReadingPlanForEntry(entryId);
  const { data: guidanceRecord } = useGuidanceRecordForEntry(entryId);
  const { data: guidedPrayer } = useGuidedPrayerForEntry(entryId);
  const { data: entryAssessment } = useAssessmentForEntry(entryId);
  const generateReadingPlan = useGenerateReadingPlan();
  const debugPrompts = useDebugPrompts();

  const { state: guidance, trigger: triggerGuidance } = useEntryGuidanceOrchestrator();
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (justCreated && entryId && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      triggerGuidance(entryId);
    }
  }, [justCreated, entryId, triggerGuidance]);

  // Reading plan: prefer whatever's already persisted (covers both a
  // completed orchestrator run and a plan generated on an earlier
  // visit); fall back to the orchestrator's own in-flight state so the
  // card reflects progress before the query cache refetches.
  const readingPlanStatus: GuidanceStatus = readingPlan
    ? 'success'
    : guidance.readingPlan.status !== 'idle'
      ? guidance.readingPlan.status
      : isLoadingReadingPlan
        ? 'loading'
        : 'idle';
  const effectiveReadingPlan = readingPlan ?? guidance.readingPlan.data;

  const motivationalStatus: GuidanceStatus = guidanceRecord
    ? 'success'
    : guidance.motivational.status;
  const effectiveMotivational = guidanceRecord ?? guidance.motivational.data;

  const guidedPrayerStatus: GuidanceStatus = guidedPrayer ? 'success' : guidance.guidedPrayer.status;
  const effectiveGuidedPrayer = guidedPrayer ?? guidance.guidedPrayer.data;

  return (
    <div>
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link to="/entries" className="text-sm text-indigo-600 hover:underline">
          ← Back to history
        </Link>

        {isLoading && <p className="mt-4 text-gray-500">Loading entry…</p>}
        {isError && <p className="mt-4 text-red-600">Failed to load entry.</p>}

        {entry && (
          <article className="mt-4">
            <p className="text-sm text-gray-500">
              {new Date(entry.created_at).toLocaleString()}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-gray-900">{entry.content}</p>
            <p className="mt-2 text-sm text-gray-500">Urge intensity: {entry.urge_intensity}/5</p>
          </article>
        )}

        <section className="mt-6">
          <h2 className="text-sm font-semibold text-gray-700">Reading Plan</h2>

          {readingPlanStatus === 'loading' && (
            <p className="mt-2 text-sm text-gray-500">Generating…</p>
          )}

          {readingPlanStatus === 'error' && (
            <p className="mt-2 text-sm text-red-600">
              {guidance.readingPlan.error ?? 'Failed to generate reading plan.'}
            </p>
          )}

          {readingPlanStatus === 'success' && effectiveReadingPlan && (
            <div className="mt-2">
              <ReadingPlanCard plan={effectiveReadingPlan} />
            </div>
          )}

          {readingPlanStatus === 'idle' && entryId && (
            <button
              type="button"
              onClick={() => generateReadingPlan.mutate(entryId)}
              disabled={generateReadingPlan.isPending}
              className="mt-2 rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {generateReadingPlan.isPending ? 'Generating…' : 'Generate reading plan'}
            </button>
          )}

          {generateReadingPlan.isError && (
            <p className="mt-2 text-sm text-red-600">
              {generateReadingPlan.error instanceof Error
                ? generateReadingPlan.error.message
                : 'Failed to generate reading plan.'}
            </p>
          )}
        </section>

        <GuidanceCard title="Motivational Word" status={motivationalStatus} error={guidance.motivational.error}>
          {effectiveMotivational && (
            <p className="mt-2 whitespace-pre-wrap text-gray-900">{effectiveMotivational.content}</p>
          )}
        </GuidanceCard>

        <GuidanceCard title="Desperation Level" status={guidance.desperation.status} error={guidance.desperation.error}>
          {guidance.desperation.data && (
            <p className="mt-2 text-gray-900">{guidance.desperation.data.desperationLevel}/10</p>
          )}
        </GuidanceCard>

        <section className="mt-6">
          <h2 className="text-sm font-semibold text-gray-700">Recommended Severity</h2>

          {!entryAssessment && guidance.severity.status === 'loading' && (
            <p className="mt-2 text-sm text-gray-500">Generating…</p>
          )}

          {!entryAssessment && guidance.severity.status === 'error' && (
            <p className="mt-2 text-sm text-red-600">
              {guidance.severity.error ?? 'Something went wrong.'}
            </p>
          )}

          {entryAssessment && (
            <p className="mt-2 text-sm text-gray-700">
              Recorded severity level {entryAssessment.severity_level}/5
              {entryAssessment.source === 'ai'
                ? ' (accepted AI recommendation).'
                : ' (your own report).'}
            </p>
          )}

          {!entryAssessment && guidance.severity.status === 'success' && guidance.severity.data && entryId && (
            <SeverityRecommendationCard
              confessionEntryId={entryId}
              recommendedSeverity={guidance.severity.data.recommendedSeverity}
            />
          )}

          {!entryAssessment && guidance.severity.status === 'idle' && (
            <p className="mt-2 text-sm text-gray-400">Not generated yet.</p>
          )}
        </section>

        <GuidanceCard title="Guided Prayer" status={guidedPrayerStatus} error={guidance.guidedPrayer.error}>
          {effectiveGuidedPrayer && (
            <p className="mt-2 whitespace-pre-wrap text-gray-900">{effectiveGuidedPrayer.content}</p>
          )}
        </GuidanceCard>

        {/* TEMPORARY: manual testing aid for the Gloo AI prompt builders.
            Remove this section (and useDebugPrompts) once prompt tuning is done. */}
        {entryId && (
          <section className="mt-8 rounded-md border border-dashed border-amber-400 p-3">
            <h2 className="text-sm font-semibold text-amber-700">
              Debug: prompt builder outputs
            </h2>
            <button
              type="button"
              onClick={() => debugPrompts.mutate(entryId)}
              disabled={debugPrompts.isPending}
              className="mt-2 rounded-md bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {debugPrompts.isPending ? 'Loading…' : 'Show prompt builder outputs'}
            </button>

            {debugPrompts.isError && (
              <p className="mt-2 text-sm text-red-600">
                {debugPrompts.error instanceof Error
                  ? debugPrompts.error.message
                  : 'Failed to load prompt builder outputs.'}
              </p>
            )}

            {debugPrompts.isSuccess && (
              <pre className="mt-2 max-h-[32rem] overflow-auto rounded bg-gray-900 p-3 text-xs text-gray-100">
                {JSON.stringify(debugPrompts.data, null, 2)}
              </pre>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
