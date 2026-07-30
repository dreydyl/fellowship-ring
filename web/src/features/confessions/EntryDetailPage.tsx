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

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Header } from '../../components/Header';
import { UrgeDots } from '../../components/UrgeDots';
import { severityColors, severityLabels } from '../../utils/severityColors';
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

// Consistent wrapper for each piece of AI guidance content on this page.
// See docs/DESIGN.md section 6 ("GuidanceCard").
function GuidanceCard({
  icon,
  label,
  accentColor,
  children,
}: {
  icon: ReactNode;
  label: string;
  accentColor: string;
  children: ReactNode;
}) {
  return (
    <div
      className="rounded-3xl p-5 mb-4 shadow-sm"
      style={{ backgroundColor: 'white', border: '1px solid var(--sg-border)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span
          className="text-xs font-display font-700 uppercase tracking-wider"
          style={{ color: accentColor }}
        >
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

// Renders the per-task loading/error/success/idle state inside a GuidanceCard,
// so each card keeps reflecting its own independent status instead of a
// single all-or-nothing spinner.
function GuidanceStatusContent({
  status,
  error,
  children,
}: {
  status: GuidanceStatus;
  error?: string;
  children?: ReactNode;
}) {
  if (status === 'loading') {
    return <p className="text-sm" style={{ color: 'var(--sg-text-muted)' }}>Generating…</p>;
  }
  if (status === 'error') {
    return <p className="text-sm" style={{ color: '#d94f4f' }}>{error ?? 'Something went wrong.'}</p>;
  }
  if (status === 'success') {
    return <>{children}</>;
  }
  return <p className="text-sm" style={{ color: 'var(--sg-text-muted)' }}>Not generated yet.</p>;
}

function SparkleIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8" />
    </svg>
  );
}

function BookIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5v-18Z" />
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    </svg>
  );
}

function PrayerIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21v-7M12 3c0 4-3 5-3 9M12 3c0 4 3 5 3 9M6 21h12" />
    </svg>
  );
}

function JournalIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14Z" />
      <path d="M8 7h8M8 11h8" />
    </svg>
  );
}

function FlameIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2s-6 5.5-6 11a6 6 0 0 0 12 0c0-2-1-3-1-3s-.5 2-2 2c-1.5 0-1-2-1-3.5C14 6.5 12 2 12 2Z" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

const READING_PLAN_ACCENT = '#8b6bcf';

// Gradient "severity assessment banner" — not a GuidanceCard, styled
// distinctly as a status indicator. See docs/DESIGN.md section 7
// ("Entry View Page" → "Severity assessment banner").
function SeverityBanner({
  score,
  sourceLabel,
  children,
}: {
  score: number;
  sourceLabel: string;
  children?: ReactNode;
}) {
  const color = severityColors[score] ?? 'var(--sg-teal)';
  return (
    <div
      className="rounded-3xl p-5 mb-4 flex items-start gap-4"
      style={{
        background: `linear-gradient(135deg, ${color}12, ${color}06)`,
        border: `1.5px solid ${color}30`,
      }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0"
        style={{ backgroundColor: color }}
      >
        <span className="text-white font-display font-900 text-xl leading-none">{score}</span>
        <span className="text-white text-[10px] font-700">/5</span>
      </div>
      <div className="flex-1">
        <p className="font-display font-700 text-base" style={{ color: 'var(--sg-text)' }}>
          Severity: {severityLabels[score]}
        </p>
        <p className="text-sm" style={{ color: 'var(--sg-text-muted)' }}>
          {sourceLabel}
        </p>
        {children}
      </div>
    </div>
  );
}

// Neutral shell matching the severity banner's chrome, used for
// loading/error/idle states before a score exists to color the tile.
function SeverityBannerShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-3xl p-5 mb-4"
      style={{
        background: 'linear-gradient(135deg, #2bbfb012, #2bbfb006)',
        border: '1.5px solid #2bbfb030',
      }}
    >
      {children}
    </div>
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
  const [showDevTools, setShowDevTools] = useState(false);

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
        <Link
          to="/entries"
          className="flex items-center gap-1.5 mb-6 text-sm font-display font-700 transition-opacity duration-150"
          style={{ color: 'var(--sg-teal)' }}
          onMouseEnter={(e: MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={(e: MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.opacity = '1')}
        >
          <ChevronLeft />
          Back to history
        </Link>

        {isLoading && <p style={{ color: 'var(--sg-text-muted)' }}>Loading entry…</p>}
        {isError && <p style={{ color: '#d94f4f' }}>Failed to load entry.</p>}

        {entry && (
          <>
            <p className="mb-4 text-sm" style={{ color: 'var(--sg-text-muted)' }}>
              {new Date(entry.created_at).toLocaleString()}
            </p>

            <GuidanceCard
              icon={<JournalIcon color="var(--sg-teal)" />}
              label="Your confession"
              accentColor="var(--sg-teal)"
            >
              <p className="whitespace-pre-wrap font-body" style={{ color: 'var(--sg-text)' }}>
                {entry.content}
              </p>
            </GuidanceCard>

            <GuidanceCard
              icon={<FlameIcon color="var(--sg-teal)" />}
              label="Urge intensity"
              accentColor="var(--sg-teal)"
            >
              <UrgeDots value={entry.urge_intensity} />
            </GuidanceCard>
          </>
        )}

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--sg-border)' }} />
          <span
            className="text-xs font-display font-700 uppercase tracking-widest"
            style={{ color: 'var(--sg-text-muted)' }}
          >
            AI Guidance
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--sg-border)' }} />
        </div>

        {entryAssessment ? (
          <SeverityBanner
            score={entryAssessment.severity_level}
            sourceLabel={
              entryAssessment.source === 'ai' ? 'Accepted AI recommendation' : 'Your own report'
            }
          />
        ) : guidance.severity.status === 'success' && guidance.severity.data && entryId ? (
          <SeverityBanner
            score={guidance.severity.data.recommendedSeverity}
            sourceLabel="AI-recommended — not yet recorded"
          >
            <div className="mt-3">
              <SeverityRecommendationCard
                confessionEntryId={entryId}
                recommendedSeverity={guidance.severity.data.recommendedSeverity}
              />
            </div>
          </SeverityBanner>
        ) : (
          <SeverityBannerShell>
            {guidance.severity.status === 'loading' && (
              <p className="text-sm" style={{ color: 'var(--sg-text-muted)' }}>
                Assessing severity…
              </p>
            )}
            {guidance.severity.status === 'error' && (
              <p className="text-sm" style={{ color: '#d94f4f' }}>
                {guidance.severity.error ?? 'Something went wrong.'}
              </p>
            )}
            {guidance.severity.status === 'idle' && (
              <p className="text-sm" style={{ color: 'var(--sg-text-muted)' }}>
                Severity assessment not generated yet.
              </p>
            )}
          </SeverityBannerShell>
        )}

        <GuidanceCard
          icon={<SparkleIcon color="var(--sg-teal)" />}
          label="An encouraging word"
          accentColor="var(--sg-teal)"
        >
          <GuidanceStatusContent status={motivationalStatus} error={guidance.motivational.error}>
            {effectiveMotivational && (
              <p className="whitespace-pre-wrap font-body" style={{ color: 'var(--sg-text)' }}>
                {effectiveMotivational.content}
              </p>
            )}
          </GuidanceStatusContent>
        </GuidanceCard>

        <GuidanceCard
          icon={<BookIcon color={READING_PLAN_ACCENT} />}
          label="Personalized reading plan"
          accentColor={READING_PLAN_ACCENT}
        >
          <GuidanceStatusContent status={readingPlanStatus} error={guidance.readingPlan.error}>
            {effectiveReadingPlan && <ReadingPlanCard plan={effectiveReadingPlan} />}
          </GuidanceStatusContent>

          {readingPlanStatus === 'idle' && entryId && (
            <button
              type="button"
              onClick={() => generateReadingPlan.mutate(entryId)}
              disabled={generateReadingPlan.isPending}
              className="mt-2 rounded-xl px-3 py-1.5 text-sm font-700 text-white disabled:opacity-50 transition-colors duration-200"
              style={{ backgroundColor: READING_PLAN_ACCENT }}
              onMouseEnter={(e) => {
                if (!generateReadingPlan.isPending) e.currentTarget.style.filter = 'brightness(0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'none';
              }}
            >
              {generateReadingPlan.isPending ? 'Generating…' : 'Generate reading plan'}
            </button>
          )}

          {generateReadingPlan.isError && (
            <p className="mt-2 text-sm" style={{ color: '#d94f4f' }}>
              {generateReadingPlan.error instanceof Error
                ? generateReadingPlan.error.message
                : 'Failed to generate reading plan.'}
            </p>
          )}
        </GuidanceCard>

        <GuidanceCard
          icon={<PrayerIcon color="var(--sg-green)" />}
          label="Guided prayer"
          accentColor="var(--sg-green)"
        >
          <GuidanceStatusContent status={guidedPrayerStatus} error={guidance.guidedPrayer.error}>
            {effectiveGuidedPrayer && (
              <div
                className="rounded-2xl p-4"
                style={{ backgroundColor: 'rgba(61,191,126,0.08)', border: '1px solid rgba(61,191,126,0.25)' }}
              >
                <p className="whitespace-pre-wrap font-body" style={{ color: 'var(--sg-text)' }}>
                  {effectiveGuidedPrayer.content}
                </p>
              </div>
            )}
          </GuidanceStatusContent>
        </GuidanceCard>

        {/* TEMPORARY: manual testing aid for the Gloo AI prompt builders.
            Remove this section (and useDebugPrompts) once prompt tuning is done. */}
        {entryId && (
          <section className="mt-8">
            <button
              type="button"
              onClick={() => setShowDevTools((prev) => !prev)}
              className="text-xs font-display font-700 uppercase tracking-wider transition-colors duration-150"
              style={{ color: 'var(--sg-text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--sg-text)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--sg-text-muted)')}
            >
              {showDevTools ? '▾' : '▸'} Developer tools
            </button>

            {showDevTools && (
              <div className="mt-2 rounded-2xl border border-dashed border-amber-400 p-3">
                <button
                  type="button"
                  onClick={() => debugPrompts.mutate(entryId)}
                  disabled={debugPrompts.isPending}
                  className="rounded-md bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-700 disabled:opacity-50"
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
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
