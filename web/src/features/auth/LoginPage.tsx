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
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(32, 'Username must be at most 32 characters')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Only letters, numbers, ".", "_", and "-" are allowed'),
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
  });

  async function onSubmit(values: Credentials) {
    setFormError(null);

    const { error } =
      mode === 'signIn'
        ? await signIn(values.username, values.password)
        : await signUp(values.username, values.password);

    if (error) {
      setFormError(error);
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
            <Field label="Username">
              <input
                id="username"
                type="text"
                autoComplete="username"
                className="w-full rounded-xl px-4 py-3 text-sm font-body outline-none transition-all duration-200"
                style={{ backgroundColor: 'var(--sg-surface)', border: '1px solid var(--sg-border)', color: 'var(--sg-text)' }}
                {...register('username')}
                onFocus={(e) => (e.target.style.borderColor = 'var(--sg-teal)')}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--sg-border)';
                  register('username').onBlur(e);
                }}
              />
              {errors.username && (
                <p className="mt-1.5 text-sm" style={{ color: '#d94f4f' }}>{errors.username.message}</p>
              )}
            </Field>

            <Field label="Password">
              <input
                id="password"
                type="password"
                autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                className="w-full rounded-xl px-4 py-3 text-sm font-body outline-none transition-all duration-200"
                style={{ backgroundColor: 'var(--sg-surface)', border: '1px solid var(--sg-border)', color: 'var(--sg-text)' }}
                {...register('password')}
                onFocus={(e) => (e.target.style.borderColor = 'var(--sg-teal)')}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--sg-border)';
                  register('password').onBlur(e);
                }}
              />
              {errors.password && (
                <p className="mt-1.5 text-sm" style={{ color: '#d94f4f' }}>{errors.password.message}</p>
              )}
            </Field>

            {formError && <p className="mt-3 text-sm" style={{ color: '#d94f4f' }}>{formError}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 w-full rounded-xl px-4 py-3 text-sm font-display font-700 text-white disabled:opacity-50 transition-colors duration-200"
              style={{ backgroundColor: 'var(--sg-green)' }}
              onMouseEnter={(e) => {
                if (!isSubmitting) e.currentTarget.style.backgroundColor = 'var(--sg-green-dark)';
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) e.currentTarget.style.backgroundColor = 'var(--sg-green)';
              }}
            >
              {mode === 'signIn' ? 'Log In' : 'Sign Up'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signIn' ? 'signUp' : 'signIn');
              setFormError(null);
            }}
            className="mt-4 w-full text-center text-sm font-display font-700 transition-colors duration-200"
            style={{ color: 'var(--sg-teal)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--sg-teal-dark)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--sg-teal)')}
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

