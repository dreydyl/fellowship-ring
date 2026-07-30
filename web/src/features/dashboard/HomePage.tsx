// Home page — merges the former DashboardPage + NewEntryPage/NewEntryForm.
// See docs/DESIGN.md section 7 ("Home Page").

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { UrgeDots } from '../../components/UrgeDots';
import { urgeColor } from '../../utils/severityColors';
import { useConfessionEntries } from '../confessions/hooks/useConfessionEntries';
import { useCreateConfessionEntry } from '../confessions/hooks/useCreateConfessionEntry';
import { useRecentGuidance } from './hooks/useRecentGuidance';

const entrySchema = z.object({
  content: z.string().min(1, 'Write something before saving.'),
  urgeIntensitySlider: z.number().min(0).max(5),
});

type EntryFormValues = z.infer<typeof entrySchema>;

const urgeLabels = ['', 'Minimal', 'Mild', 'Moderate', 'Significant', 'Severe'];

// The slider itself moves continuously (no snapping) between 0 and 5.
// The value that gets submitted and shown to the user is the ceiling of
// the current slider position, clamped to the 1-5 range the field stores.
function toUrgeIntensity(sliderValue: number): number {
  return Math.min(5, Math.max(1, Math.ceil(sliderValue)));
}

function ThreeCrosses() {
  return (
    <svg viewBox="0 0 140 90" width="140" height="90" fill="none" aria-hidden="true">
      {/* Ground line */}
      <path d="M0 82 C 35 74, 105 74, 140 82" stroke="white" strokeWidth="2" opacity="0.35" />
      {/* Left cross */}
      <rect x="22.5" y="30" width="3" height="45" rx="2" fill="white" opacity="0.55" />
      <rect x="14" y="42" width="20" height="3" rx="2" fill="white" opacity="0.55" />
      {/* Center cross (taller) */}
      <rect x="65.5" y="12" width="3" height="63" rx="2" fill="white" opacity="0.7" />
      <rect x="53" y="28" width="28" height="3" rx="2" fill="white" opacity="0.7" />
      {/* Right cross */}
      <rect x="106.5" y="34" width="3" height="41" rx="2" fill="white" opacity="0.5" />
      <rect x="99" y="45" width="18" height="3" rx="2" fill="white" opacity="0.5" />
    </svg>
  );
}

function SpinIcon() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
      <path d="M8 2a6 6 0 0 1 6 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const createEntry = useCreateConfessionEntry();
  const { data: entries, isLoading: entriesLoading } = useConfessionEntries();
  const { data: guidance } = useRecentGuidance();

  const [focused, setFocused] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: { content: '', urgeIntensitySlider: 1 },
  });

  const sliderValue = watch('urgeIntensitySlider');
  const content = watch('content');
  const urgeIntensity = toUrgeIntensity(sliderValue);
  const urgeColorValue = urgeColor(urgeIntensity);
  const submitting = createEntry.isPending;
  const isEmpty = !content || content.trim().length === 0;

  async function onSubmit(values: EntryFormValues) {
    const entry = await createEntry.mutateAsync({
      content: values.content,
      urgeIntensity: toUrgeIntensity(values.urgeIntensitySlider),
    });
    // justCreated tells EntryDetailPage to kick off the entry-guidance
    // orchestrator (assess-desperation, generate-reading-plan,
    // generate-motivational, recommend-severity, generate-guided-prayer)
    // as soon as it mounts, instead of just showing manual buttons.
    navigate(`/entries/${entry.id}`, { state: { justCreated: true } });
  }

  const recentEntries = entries?.slice(0, 3) ?? [];

  function guidanceFor(entryId: string) {
    return guidance?.find((g) => g.confession_entry_id === entryId);
  }

  return (
    <div>
      <Header />

      {/* Hero panel */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, var(--sg-teal) 0%, var(--sg-teal-dark) 100%)',
          minHeight: 280,
        }}
      >
        <div className="mx-auto flex max-w-2xl flex-col items-center px-4 pt-10 text-center">
          <ThreeCrosses />
          <h1 className="mt-4 font-display font-900 text-4xl text-white">Solid Ground</h1>
          <p className="mt-2 font-body text-sm text-white" style={{ opacity: 0.85 }}>
            Gateway to Accountability
          </p>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: 40,
            backgroundColor: 'var(--sg-surface)',
            borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
          }}
        />
      </div>

      <div className="mx-auto max-w-2xl px-4 py-4">
        {/* Confession card */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-3xl bg-white p-5 shadow-sm"
          style={{ border: '1px solid var(--sg-border)' }}
        >
          <label htmlFor="content" className="font-display font-700 text-sm" style={{ color: 'var(--sg-text)' }}>
            What's on your heart?
          </label>
          <textarea
            id="content"
            rows={5}
            className="mt-2 block w-full rounded-xl p-3 font-body text-sm transition-all duration-200"
            style={{
              resize: 'none',
              outline: 'none',
              border: `1px solid ${focused ? 'var(--sg-teal)' : 'var(--sg-border)'}`,
              color: 'var(--sg-text)',
            }}
            {...register('content')}
            onFocus={() => setFocused(true)}
            onBlur={(e) => {
              setFocused(false);
              register('content').onBlur(e);
            }}
          />
          {errors.content && (
            <p className="mt-1 text-sm" style={{ color: '#d94f4f' }}>
              {errors.content.message}
            </p>
          )}

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <label htmlFor="urgeIntensitySlider" className="font-display font-700 text-sm" style={{ color: 'var(--sg-text)' }}>
                Urge intensity
              </label>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-display font-700"
                style={{ backgroundColor: `${urgeColorValue}18`, color: urgeColorValue }}
              >
                {urgeIntensity} — {urgeLabels[urgeIntensity]}
              </span>
            </div>
            <input
              id="urgeIntensitySlider"
              type="range"
              min={0}
              max={5}
              step="any"
              className="mt-2 block w-full"
              style={{ ['--range-pct' as string]: `${((urgeIntensity - 1) / 4) * 100}%` }}
              {...register('urgeIntensitySlider', { valueAsNumber: true })}
            />
          </div>

          {createEntry.isError && (
            <p className="mt-2 text-sm" style={{ color: '#d94f4f' }}>
              {createEntry.error instanceof Error
                ? createEntry.error.message
                : 'Something went wrong saving your entry.'}
            </p>
          )}

          <button
            type="submit"
            disabled={isEmpty || submitting}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-display font-800 text-base text-white transition-colors duration-150"
            style={{
              backgroundColor: isEmpty || submitting ? '#a8d9d3' : 'var(--sg-green)',
              cursor: isEmpty || submitting ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!isEmpty && !submitting) e.currentTarget.style.backgroundColor = 'var(--sg-green-dark)';
            }}
            onMouseLeave={(e) => {
              if (!isEmpty && !submitting) e.currentTarget.style.backgroundColor = 'var(--sg-green)';
            }}
          >
            {submitting ? (
              <>
                <SpinIcon />
                Receiving guidance…
              </>
            ) : (
              'Submit & Receive Guidance'
            )}
          </button>
        </form>

        {/* Recent entries preview */}
        <section className="mt-6">
          <h2 className="font-display font-800 text-xl" style={{ color: 'var(--sg-text)' }}>
            Recent Entries
          </h2>
          {entriesLoading && (
            <p className="mt-2 font-body text-sm" style={{ color: 'var(--sg-text-muted)' }}>
              Loading…
            </p>
          )}
          {!entriesLoading && recentEntries.length === 0 && (
            <p className="mt-2 font-body text-sm" style={{ color: 'var(--sg-text-muted)' }}>
              No entries yet.
            </p>
          )}
          <ul className="mt-2 space-y-3">
            {recentEntries.map((entry) => {
              const entryGuidance = guidanceFor(entry.id);
              return (
                <li key={entry.id}>
                  <Link
                    to={`/entries/${entry.id}`}
                    className="block rounded-3xl bg-white p-4 shadow-sm"
                    style={{ border: '1px solid var(--sg-border)' }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-body text-xs" style={{ color: 'var(--sg-text-muted)' }}>
                        {new Date(entry.created_at).toLocaleString()}
                      </p>
                      <UrgeDots value={entry.urge_intensity} />
                    </div>
                    <p className="mt-1 line-clamp-2 font-body text-sm" style={{ color: 'var(--sg-text)' }}>
                      {entry.content}
                    </p>
                    {entryGuidance && (
                      <p className="mt-1 line-clamp-1 font-body text-xs italic" style={{ color: 'var(--sg-text-muted)' }}>
                        {entryGuidance.content}
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            to="/entries"
            className="mt-3 inline-block font-display font-700 text-sm"
            style={{ color: 'var(--sg-teal)' }}
          >
            View all history →
          </Link>
        </section>
      </div>
    </div>
  );
}
