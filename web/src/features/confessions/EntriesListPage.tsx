// History of confession entries, most recent first, plus the addiction
// severity timeline (self-reported + AI-recommended). See docs/DESIGN.md
// section 7 ("History Page").

import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/Header';
import { UrgeDots } from '../../components/UrgeDots';
import { severityColors, severityLabels } from '../../utils/severityColors';
import { useConfessionEntries } from './hooks/useConfessionEntries';
import { useSeverityHistory } from '../assessment/hooks/useSeverityHistory';

function JournalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="1.5" width="12" height="13" rx="1.5" stroke="var(--sg-teal)" strokeWidth="1.4" />
      <path d="M5 5h6M5 8h6M5 11h3.5" stroke="var(--sg-teal)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M1.5 12.5l4-4.5 3 2.5 5.5-6.5"
        stroke="var(--sg-teal)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EntriesListPage() {
  const { data: entries, isLoading, isError } = useConfessionEntries();
  const { data: severityHistory, isLoading: severityLoading } = useSeverityHistory();

  return (
    <div>
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display font-900 text-2xl" style={{ color: 'var(--sg-text)' }}>
            Your Entries
          </h1>
          <span className="font-body text-sm" style={{ color: 'var(--sg-text-muted)' }}>
            {entries?.length ?? 0} {entries?.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <JournalIcon />
            <span
              className="font-display font-700 text-xs uppercase tracking-wider"
              style={{ color: 'var(--sg-text-muted)' }}
            >
              Confession Entries
            </span>
          </div>

          {isLoading && (
            <p className="font-body text-sm" style={{ color: 'var(--sg-text-muted)' }}>
              Loading entries…
            </p>
          )}
          {isError && (
            <p className="font-body text-sm" style={{ color: '#d94f4f' }}>
              Failed to load entries.
            </p>
          )}

          {entries && entries.length === 0 && (
            <p className="font-body text-sm" style={{ color: 'var(--sg-text-muted)' }}>
              No entries yet. <Link to="/" style={{ color: 'var(--sg-teal)' }}>Write your first one.</Link>
            </p>
          )}

          <div className="flex flex-col gap-3">
            {entries?.map((entry) => (
              <Link
                key={entry.id}
                to={`/entries/${entry.id}`}
                className="block w-full rounded-3xl bg-white p-4 text-left shadow-sm transition-colors duration-150"
                style={{ border: '1px solid var(--sg-border)' }}
                onMouseEnter={(e: MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.backgroundColor = 'var(--sg-teal-50, #f0fdfb)')}
                onMouseLeave={(e: MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.backgroundColor = 'white')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display font-700 text-sm" style={{ color: 'var(--sg-teal)' }}>
                      {new Date(entry.created_at).toLocaleDateString()}
                    </span>
                    <span className="font-body text-xs" style={{ color: 'var(--sg-text-muted)' }}>
                      {new Date(entry.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                  <UrgeDots value={entry.urge_intensity} />
                </div>

                <p className="mt-2 line-clamp-2 font-body text-sm" style={{ color: 'var(--sg-text)' }}>
                  {entry.content}
                </p>

                <div className="mt-2 flex items-center justify-between">
                  <span className="font-body text-xs" style={{ color: 'var(--sg-text-muted)' }}>
                    Urge: {entry.urge_intensity}/5
                  </span>
                  <span className="font-display font-700 text-xs" style={{ color: 'var(--sg-teal)' }}>
                    View guidance →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <TrendIcon />
            <span
              className="font-display font-700 text-xs uppercase tracking-wider"
              style={{ color: 'var(--sg-text-muted)' }}
            >
              Addiction Severity Timeline
            </span>
          </div>

          <div className="rounded-3xl bg-white shadow-sm" style={{ border: '1px solid var(--sg-border)' }}>
            {severityLoading && (
              <p className="p-5 font-body text-sm" style={{ color: 'var(--sg-text-muted)' }}>
                Loading…
              </p>
            )}
            {!severityLoading && (severityHistory?.length ?? 0) === 0 && (
              <p className="p-5 font-body text-sm" style={{ color: 'var(--sg-text-muted)' }}>
                No severity records yet.
              </p>
            )}
            {severityHistory?.map((record, i) => {
              const isSelfReport = record.source === 'self_report';
              const badgeColor = isSelfReport ? '#f0a500' : 'var(--sg-teal)';
              const score = record.severity_level;
              return (
                <div
                  key={record.id}
                  className="flex items-center justify-between px-5 py-3.5"
                  style={{
                    borderTop: i === 0 ? 'none' : '1px solid var(--sg-border)',
                  }}
                >
                  <div>
                    <p className="font-display font-700 text-sm" style={{ color: 'var(--sg-text)' }}>
                      {isSelfReport ? 'Self-Reported' : 'AI Recommended'}
                    </p>
                    <p className="font-body text-xs" style={{ color: 'var(--sg-text-muted)' }}>
                      {new Date(record.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 font-display font-700 text-xs"
                      style={{ backgroundColor: `${badgeColor}18`, color: badgeColor }}
                    >
                      {isSelfReport ? 'Self-Reported' : 'AI'}
                    </span>
                    <div className="text-right">
                      <p className="font-display font-800 text-sm" style={{ color: severityColors[score] }}>
                        {score}
                      </p>
                      <p className="font-body text-xs" style={{ color: 'var(--sg-text-muted)' }}>
                        {severityLabels[score]}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

