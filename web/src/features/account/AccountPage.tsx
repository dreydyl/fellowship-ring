// Account page: merges the former SettingsPage + SelfReportPage/SelfReportForm
// + profile email display into one page with four sections — Profile,
// Security, Addiction Severity, Preferences.
// See docs/DESIGN.md section 7 ("Account Page") and section 6
// ("Section / Field (Account)").

import { useState, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Header } from '../../components/Header';
import { severityColors, severityLabels } from '../../utils/severityColors';
import { useProfile } from '../assessment/hooks/useProfile';
import { useSubmitSelfReport } from '../assessment/hooks/useSubmitSelfReport';
import { useSeverityHistory } from '../assessment/hooks/useSeverityHistory';
import { useUpdateGender, type Gender } from '../settings/hooks/useUpdateGender';

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sg-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sg-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sg-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l5-5 4 4 8-9" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sg-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h13M20 18h0" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="8" cy="12" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sg-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sg-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 11 7 11 7a20.4 20.4 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div
      className="rounded-3xl p-5 mb-4 shadow-sm"
      style={{ backgroundColor: 'white', border: '1px solid var(--sg-border)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <span className="font-display font-700 text-sm" style={{ color: 'var(--sg-text)' }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <span
        className="block mb-1.5 text-xs font-display font-700 uppercase tracking-wider"
        style={{ color: 'var(--sg-text-muted)' }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  autoComplete,
}: {
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="flex items-center rounded-xl px-4"
      style={{ backgroundColor: 'var(--sg-surface)', border: '1px solid var(--sg-border)' }}
    >
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="flex-1 py-3 text-sm bg-transparent outline-none font-body"
        style={{ color: 'var(--sg-text)' }}
      />
      <button type="button" onClick={() => setShow((prev) => !prev)} aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

// Compact SVG sparkline showing the severity trend across the last 8
// records, fed by useSeverityHistory. See docs/DESIGN.md section 7
// ("Account Page" → "SeverityMiniChart").
function SeverityMiniChart({
  records,
}: {
  records: { source: 'self_report' | 'ai'; severity_level: number }[];
}) {
  if (records.length < 2) return null;

  const max = 5;
  const points = records.map((record, i) => ({
    x: i * (100 / (records.length - 1)),
    y: ((max - record.severity_level) / max) * 100,
    source: record.source,
  }));

  return (
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
  );
}

export function AccountPage() {
  const { user, updatePassword } = useAuth();

  // Security section — local form state, wired to useAuth().updatePassword,
  // which re-verifies currentPw via supabase.auth.signInWithPassword before
  // calling supabase.auth.updateUser.
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaved, setPwSaved] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const passwordsMismatch = newPw !== '' && confirmPw !== '' && newPw !== confirmPw;
  const canSavePassword =
    currentPw !== '' && newPw !== '' && confirmPw !== '' && newPw === confirmPw;

  async function handleSavePassword() {
    if (!canSavePassword || pwSaving) return;
    setPwError(null);
    setPwSaving(true);

    const { error } = await updatePassword(currentPw, newPw);

    setPwSaving(false);

    if (error) {
      setPwError(error);
      return;
    }

    setPwSaved(true);
    setTimeout(() => {
      setPwSaved(false);
      setShowPasswordForm(false);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    }, 2000);
  }

  // Addiction Severity section
  const { data: profile } = useProfile();
  const submitSelfReport = useSubmitSelfReport();
  const { data: severityHistory } = useSeverityHistory();
  const [selfSeverity, setSelfSeverity] = useState(profile?.current_severity_level ?? 3);

  const recentSeverity = (severityHistory ?? []).slice(0, 8).reverse();

  // Preferences section
  const updateGender = useUpdateGender();
  const [gender, setGender] = useState<Gender>(profile?.gender ?? 'none');

  return (
    <div>
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 font-display font-900 text-2xl" style={{ color: 'var(--sg-text)' }}>
          Account
        </h1>

        <Section icon={<UserIcon />} title="Profile">
          <Field label="Email">
            <p className="text-sm font-body" style={{ color: 'var(--sg-text)' }}>
              {user?.email}
            </p>
          </Field>
        </Section>

        <Section icon={<LockIcon />} title="Security">
          {!showPasswordForm ? (
            <button
              type="button"
              onClick={() => setShowPasswordForm(true)}
              className="rounded-xl px-4 py-2 text-sm font-display font-700 transition-colors duration-200"
              style={{ border: '1px solid var(--sg-border)', color: 'var(--sg-teal)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--sg-surface)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              Change password
            </button>
          ) : (
            <div>
              <Field label="Current password">
                <PasswordInput value={currentPw} onChange={setCurrentPw} autoComplete="current-password" />
              </Field>
              <Field label="New password">
                <PasswordInput value={newPw} onChange={setNewPw} autoComplete="new-password" />
              </Field>
              <Field label="Confirm new password">
                <PasswordInput value={confirmPw} onChange={setConfirmPw} autoComplete="new-password" />
              </Field>

              {passwordsMismatch && (
                <p className="mb-3 text-sm" style={{ color: '#d94f4f' }}>
                  Passwords do not match.
                </p>
              )}

              {pwError && (
                <p className="mb-3 text-sm" style={{ color: '#d94f4f' }}>
                  {pwError}
                </p>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSavePassword}
                  disabled={!canSavePassword || pwSaving}
                  className="rounded-xl px-4 py-2 text-sm font-display font-700 text-white transition-colors duration-200"
                  style={{
                    backgroundColor: canSavePassword ? 'var(--sg-teal)' : '#a8d9d3',
                    cursor: canSavePassword && !pwSaving ? 'pointer' : 'not-allowed',
                  }}
                  onMouseEnter={(e) => {
                    if (canSavePassword && !pwSaving) e.currentTarget.style.backgroundColor = 'var(--sg-teal-dark)';
                  }}
                  onMouseLeave={(e) => {
                    if (canSavePassword && !pwSaving) e.currentTarget.style.backgroundColor = 'var(--sg-teal)';
                  }}
                >
                  {pwSaved ? '✓ Saved' : pwSaving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setCurrentPw('');
                    setNewPw('');
                    setConfirmPw('');
                    setPwError(null);
                  }}
                  className="text-sm font-display font-700 transition-colors duration-200"
                  style={{ color: 'var(--sg-text-muted)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--sg-text)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--sg-text-muted)')}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Section>

        <Section icon={<TrendIcon />} title="Addiction Severity">
          <div className="flex flex-wrap gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((n) => {
              const selected = selfSeverity === n;
              const color = severityColors[n];
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSelfSeverity(n)}
                  className="rounded-xl px-3 py-2 text-sm font-display font-700 transition-colors duration-150"
                  style={{
                    border: `1px solid ${selected ? color : 'var(--sg-border)'}`,
                    color: selected ? color : 'var(--sg-text-muted)',
                    backgroundColor: selected ? `${color}18` : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) e.currentTarget.style.borderColor = color;
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) e.currentTarget.style.borderColor = 'var(--sg-border)';
                  }}
                >
                  {n} · {severityLabels[n]}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() =>
              submitSelfReport.mutate({
                severityLevel: selfSeverity,
                addictionType: profile?.current_addiction_type ?? undefined,
              })
            }
            disabled={submitSelfReport.isPending}
            className="rounded-xl px-4 py-2 text-sm font-display font-700 text-white disabled:opacity-50 transition-colors duration-200"
            style={{ backgroundColor: 'var(--sg-green)' }}
            onMouseEnter={(e) => {
              if (!submitSelfReport.isPending) e.currentTarget.style.backgroundColor = 'var(--sg-green-dark)';
            }}
            onMouseLeave={(e) => {
              if (!submitSelfReport.isPending) e.currentTarget.style.backgroundColor = 'var(--sg-green)';
            }}
          >
            {submitSelfReport.isPending ? 'Saving…' : 'Save'}
          </button>

          {submitSelfReport.isError && (
            <p className="mt-2 text-sm" style={{ color: '#d94f4f' }}>
              {submitSelfReport.error instanceof Error
                ? submitSelfReport.error.message
                : 'Failed to record your report.'}
            </p>
          )}
          {submitSelfReport.isSuccess && (
            <p className="mt-2 text-sm" style={{ color: 'var(--sg-green)' }}>
              Saved.
            </p>
          )}

          {recentSeverity.length >= 2 && (
            <div className="mt-4">
              <span
                className="block mb-1.5 text-xs font-display font-700 uppercase tracking-wider"
                style={{ color: 'var(--sg-text-muted)' }}
              >
                Trend
              </span>
              <SeverityMiniChart records={recentSeverity} />
            </div>
          )}
        </Section>

        <Section icon={<TrendIcon />} title="Addiction Severity Timeline">
          {(severityHistory?.length ?? 0) === 0 && (
            <p className="font-body text-sm" style={{ color: 'var(--sg-text-muted)' }}>
              No severity records yet.
            </p>
          )}
          <div className="flex flex-col">
            {severityHistory?.map((record, i) => {
              const isSelfReport = record.source === 'self_report';
              const badgeColor = isSelfReport ? '#f0a500' : 'var(--sg-teal)';
              const score = record.severity_level;
              return (
                <div
                  key={record.id}
                  className="flex items-center justify-between py-3.5"
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
        </Section>

        <Section icon={<SlidersIcon />} title="Preferences">
          <Field label="Gender">
            <select
              value={gender}
              onChange={(e) => {
                const next = e.target.value as Gender;
                setGender(next);
                updateGender.mutate(next);
              }}
              className="w-full rounded-xl px-4 py-3 text-sm font-body outline-none transition-all duration-200"
              style={{ backgroundColor: 'var(--sg-surface)', border: '1px solid var(--sg-border)', color: 'var(--sg-text)' }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--sg-teal)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--sg-border)')}
            >
              <option value="none">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </Field>

          {updateGender.isError && (
            <p className="mt-2 text-sm" style={{ color: '#d94f4f' }}>
              {updateGender.error instanceof Error
                ? updateGender.error.message
                : 'Failed to update your profile.'}
            </p>
          )}
          {updateGender.isSuccess && (
            <p className="mt-2 text-sm" style={{ color: 'var(--sg-green)' }}>
              Saved.
            </p>
          )}
        </Section>
      </div>
    </div>
  );
}
