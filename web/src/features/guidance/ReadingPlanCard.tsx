// Basic card displaying the AI-suggested reading plan for a
// confession entry, using the official YouVersion Platform SDK's
// BibleTextView component (styled to match our design tokens) to
// render verse text.
//
// Each passage is rendered as a collapsed "step" that the user opens
// one at a time as they work through the plan, instead of showing
// every passage's text at once.
//
// Unlike BibleCard, BibleTextView does NOT render copyright itself, so
// we're responsible for showing it — see
// https://developers.youversion.com/sdks/react/guides/copyright-and-attribution.
// Shown once beneath the whole plan (not per-passage) since every step
// here reads from the same Bible version.

import { useState } from 'react';
import { BibleTextView } from '@youversion/platform-react-ui';
import { useVersion } from '@youversion/platform-react-hooks';
import { toUsfmReference } from './utils/bibleReference';
import type { ReadingPlan } from './hooks/useReadingPlanForEntry';

const DEFAULT_VERSION_ID = 111; // NIV

// Matches the purple accent used for the "Personalized Bible devotional"
// GuidanceCard on the Entry View page (see EntryDetailPage's
// READING_PLAN_ACCENT), so the steps inside read as part of the same card.
const ACCENT = '#8b6bcf';

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--sg-text-muted)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        flexShrink: 0,
        transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
        transition: 'transform 150ms ease',
      }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

interface ReadingPlanCardProps {
  plan: ReadingPlan;
}

export function ReadingPlanCard({ plan }: ReadingPlanCardProps) {
  const passages = plan.plan_json.passages
    .slice()
    .sort((a, b) => (a.number ?? 0) - (b.number ?? 0));

  // Accordion-style: one step open at a time, starting on the first.
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const { version } = useVersion(DEFAULT_VERSION_ID);

  return (
    <div
      className="rounded-2xl p-4"
      style={{ backgroundColor: 'var(--sg-surface)', border: '1px solid var(--sg-border)' }}
    >
      <h3 className="font-display font-800 text-sm" style={{ color: 'var(--sg-text)' }}>
        {plan.title}
      </h3>
      {plan.description && (
        <p className="font-body mt-1 text-sm" style={{ color: 'var(--sg-text-muted)' }}>
          {plan.description}
        </p>
      )}
      <ul className="mt-3 space-y-2">
        {passages.map((passage, index) => {
          const usfmReference = toUsfmReference(passage.reference);
          const isOpen = openIndex === index;

          return (
            <li
              key={passage.reference}
              className="overflow-hidden rounded-xl"
              style={{ backgroundColor: 'var(--sg-white)', border: '1px solid var(--sg-border)' }}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-3 p-3 text-left transition-colors duration-150"
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${ACCENT}0d`)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span className="flex items-center gap-3">
                  <span
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-display font-700 text-xs"
                    style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}
                  >
                    {index + 1}
                  </span>
                  <span className="font-display font-700 text-sm" style={{ color: ACCENT }}>
                    {passage.reference}
                  </span>
                </span>
                <ChevronIcon open={isOpen} />
              </button>

              {isOpen && (
                <div className="px-3 pb-3">
                  {usfmReference ? (
                    <BibleTextView
                      reference={usfmReference}
                      versionId={DEFAULT_VERSION_ID}
                      fontFamily="var(--font-body)"
                      fontSize={15}
                      lineHeight={1.7}
                      showVerseNumbers
                    />
                  ) : (
                    <p className="font-body text-sm" style={{ color: '#d94f4f' }}>
                      Unable to display this reference.
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {version?.copyright && (
        <p
          className="font-body mt-3 text-xs"
          style={{ color: 'var(--sg-text-muted)' }}
        >
          {version.copyright}
        </p>
      )}
    </div>
  );
}
