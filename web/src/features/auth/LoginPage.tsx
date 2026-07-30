// Login/signup page using react-hook-form + zod validation,
// wired up to Supabase auth via useAuth(). Restyled to match the
// Account page's card/token aesthetic so a signed-out user routed
// here from the header's Account link feels like a continuous
// "Account" destination. See docs/DESIGN.md section 7
// ("Account Page" — LoginPage design note).

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { useAuth } from './AuthProvider';

const credentialsSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type Credentials = z.infer<typeof credentialsSchema>;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
  });

  async function onSubmit(values: Credentials) {
    setFormError(null);
    setInfoMessage(null);

    const { error } =
      mode === 'signIn'
        ? await signIn(values.email, values.password)
        : await signUp(values.email, values.password);

    if (error) {
      setFormError(error);
      return;
    }

    if (mode === 'signUp') {
      setInfoMessage('Account created. Check your email to confirm, then sign in.');
      setMode('signIn');
      return;
    }

    navigate('/');
  }

  return (
    <div>
      <Header />
      <div className="mx-auto max-w-sm px-4 py-8">
        <h1 className="mb-6 font-display font-900 text-2xl" style={{ color: 'var(--sg-text)' }}>
          {mode === 'signIn' ? 'Log In' : 'Create Account'}
        </h1>

        <div
          className="rounded-3xl p-5 shadow-sm"
          style={{ backgroundColor: 'white', border: '1px solid var(--sg-border)' }}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <Field label="Email">
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="w-full rounded-xl px-4 py-3 text-sm font-body outline-none"
                style={{ backgroundColor: 'var(--sg-surface)', border: '1px solid var(--sg-border)', color: 'var(--sg-text)' }}
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1.5 text-sm" style={{ color: '#d94f4f' }}>{errors.email.message}</p>
              )}
            </Field>

            <Field label="Password">
              <input
                id="password"
                type="password"
                autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                className="w-full rounded-xl px-4 py-3 text-sm font-body outline-none"
                style={{ backgroundColor: 'var(--sg-surface)', border: '1px solid var(--sg-border)', color: 'var(--sg-text)' }}
                {...register('password')}
              />
              {errors.password && (
                <p className="mt-1.5 text-sm" style={{ color: '#d94f4f' }}>{errors.password.message}</p>
              )}
            </Field>

            {formError && <p className="mt-3 text-sm" style={{ color: '#d94f4f' }}>{formError}</p>}
            {infoMessage && (
              <p className="mt-3 text-sm" style={{ color: 'var(--sg-green)' }}>{infoMessage}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 w-full rounded-xl px-4 py-3 text-sm font-display font-700 text-white disabled:opacity-50"
              style={{ backgroundColor: 'var(--sg-green)' }}
            >
              {mode === 'signIn' ? 'Log In' : 'Sign Up'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signIn' ? 'signUp' : 'signIn');
              setFormError(null);
              setInfoMessage(null);
            }}
            className="mt-4 w-full text-center text-sm font-display font-700"
            style={{ color: 'var(--sg-teal)' }}
          >
            {mode === 'signIn'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}

