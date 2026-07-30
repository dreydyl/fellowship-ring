// Compact SVG sparkline showing the severity trend, fed by
// useSeverityHistory. See docs/DESIGN.md section 7 ("Account Page" →
// "SeverityMiniChart").
//
// X positions are date-based (not index-based): domainEnd is always
// "now". domainStart is clamped to whichever is *later* of the selected
// range's rolling-window lower bound and the earliest record's
// created_at — so switching to a wider range (e.g. Lifetime) never
// pads the chart with blank space before the user's actual journey
// start. The X-axis renders a handful of date labels, whose count
// scales with the chart's rendered pixel width (via ResizeObserver) so
// labels never crowd/overlap on narrow layouts.

import { useEffect, useRef, useState } from 'react';
import type { SeverityHistoryRecord } from '../assessment/hooks/useSeverityHistory';

type SeverityRange = 'month' | 'sixMonths' | 'year' | 'lifetime';

const RANGE_OPTIONS: { value: SeverityRange; label: string; days: number | null }[] = [
  { value: 'month', label: 'Past Month', days: 30 },
  { value: 'sixMonths', label: 'Past 6 Months', days: 182 },
  { value: 'year', label: 'Past Year', days: 365 },
  { value: 'lifetime', label: 'Lifetime', days: null },
];

// Width buckets (px) -> how many x-axis date labels to render.
function tickCountForWidth(width: number): number {
  if (width < 260) return 2;
  if (width < 420) return 3;
  if (width < 600) return 4;
  return 5;
}

function formatTickDate(date: Date, range: SeverityRange, domainSpanMs: number): string {
  // If everything visible fits within a 3-day window, dates alone
  // wouldn't distinguish points meaningfully — show times instead.
  if (domainSpanMs <= 3 * 86_400_000) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  if (range === 'month' || range === 'sixMonths') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.toLocaleDateString('en-US', { year: '2-digit' });
  return `${month} '${year}`;
}

export function SeverityMiniChart({ records }: { records: SeverityHistoryRecord[] }) {
  const [range, setRange] = useState<SeverityRange>('sixMonths');
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    setContainerWidth(el.getBoundingClientRect().width);

    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (records.length < 2) return null;

  const sorted = [...records].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const earliestRecordDate = new Date(sorted[0].created_at).getTime();
  const domainEnd = Date.now();
  const rangeDays = RANGE_OPTIONS.find((option) => option.value === range)?.days ?? null;
  const rangeLowerBound = rangeDays === null ? earliestRecordDate : domainEnd - rangeDays * 86_400_000;
  const domainStart = Math.max(rangeLowerBound, earliestRecordDate);
  const domainSpan = domainEnd - domainStart || 1;

  const visibleRecords = sorted.filter((record) => new Date(record.created_at).getTime() >= domainStart);

  const max = 5;
  const points = visibleRecords.map((record) => ({
    x: ((new Date(record.created_at).getTime() - domainStart) / domainSpan) * 100,
    y: ((max - record.severity_level) / max) * 100,
    source: record.source,
  }));

  const tickCount = tickCountForWidth(containerWidth);
  const ticks =
    points.length < 2
      ? []
      : Array.from({ length: tickCount }, (_, i) => {
          const fraction = tickCount === 1 ? 0 : i / (tickCount - 1);
          return {
            x: fraction * 100,
            label: formatTickDate(new Date(domainStart + fraction * domainSpan), range, domainSpan),
          };
        });

  return (
    <div ref={containerRef}>
      <div className="mb-2 inline-flex rounded-lg p-0.5" style={{ backgroundColor: 'var(--sg-surface)', border: '1px solid var(--sg-border)' }}>
        {RANGE_OPTIONS.map((option) => {
          const selected = option.value === range;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setRange(option.value)}
              className="rounded-md px-2 py-1 text-[11px] font-body transition-colors duration-150"
              style={{
                color: selected ? 'var(--sg-teal)' : 'var(--sg-text-muted)',
                backgroundColor: selected ? 'white' : 'transparent',
                boxShadow: selected ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {points.length < 2 ? (
        <div className="h-16 flex items-center justify-center">
          <p className="text-xs font-body" style={{ color: 'var(--sg-text-muted)' }}>
            Not enough history in this range yet.
          </p>
        </div>
      ) : (
        <>
          <div className="h-16 relative">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
              {[20, 40, 60, 80].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="rgba(43,191,176,0.08)"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              <polyline
                points={points.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="var(--sg-teal)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            {/* Dots are rendered as absolutely-positioned HTML elements, not SVG
                circles, because the chart's non-uniform (wide, short) aspect
                ratio combined with preserveAspectRatio="none" stretches SVG
                circles into ellipses even with vector-effect applied (that
                attribute only protects stroke width, not radius). */}
            {points.map((p, i) => (
              <span
                key={i}
                className="absolute h-2 w-2 rounded-full"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: 'white',
                  border: `2px solid ${p.source === 'ai' ? 'var(--sg-teal)' : '#f0a500'}`,
                }}
              />
            ))}
          </div>
          {/* Tick labels are HTML elements (not SVG text) for the same
              reason the dots are: preserveAspectRatio="none" distorts SVG
              text just like it does circles. */}
          <div className="relative h-4 mt-1">
            {ticks.map((tick, i) => (
              <span
                key={i}
                className="absolute text-[10px] font-body whitespace-nowrap"
                style={{
                  left: `${tick.x}%`,
                  color: 'var(--sg-text-muted)',
                  transform:
                    i === 0 ? 'translateX(0)' : i === ticks.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)',
                }}
              >
                {tick.label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
