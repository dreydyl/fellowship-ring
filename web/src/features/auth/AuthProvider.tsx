// Authentication provider: exposes the current Supabase auth session
// and user to the rest of the application via React context.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabaseClient';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (username: string, password: string) => Promise<{ error: string | null }>;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Supabase Auth is still email/password under the hood, but the product
// only asks users for a username (no real email required — important for
// letting hackathon judges sign up instantly with any made-up name).
// We synthesize a stable, valid-format email from the username so the
// existing supabase-js email/password APIs keep working unchanged.
const USERNAME_EMAIL_DOMAIN = 'users.fellowshipring.app';

function usernameToEmail(username: string): string {
  const sanitized = username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-');
  return `${sanitized}@${USERNAME_EMAIL_DOMAIN}`;
}

// Reads the username back for display: prefer the metadata we stored at
// signup, falling back to stripping the synthetic domain off the email
// (covers any account created before this field existed).
export function getDisplayUsername(user: User | null): string {
  if (!user) return '';
  const metadataUsername = user.user_metadata?.username;
  if (typeof metadataUsername === 'string' && metadataUsername.length > 0) {
    return metadataUsername;
  }
  return user.email?.split('@')[0] ?? '';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        setSession(null);
        setLoading(false);
        return;
      }

      // getSession() only reads the locally cached session; it can be
      // stale (e.g. after a local `supabase db reset` wipes auth.users
      // while the browser still holds an old JWT). Validate against the
      // server and drop the session if the user no longer exists.
      const { error } = await supabase.auth.getUser();
      if (error) {
        await supabase.auth.signOut();
        setSession(null);
      } else {
        setSession(data.session);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signUp(username: string, password: string) {
    const { error } = await supabase.auth.signUp({
      email: usernameToEmail(username),
      password,
      options: { data: { username } },
    });
    return { error: error?.message ?? null };
  }

  async function signIn(username: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  // Re-verifies the user's current password via signInWithPassword before
  // calling supabase.auth.updateUser — this prevents a still-logged-in
  // session from silently changing the password without confirming the
  // current credentials first.
  async function updatePassword(currentPassword: string, newPassword: string) {
    const email = session?.user.email;
    if (!email) {
      return { error: 'You must be signed in to change your password.' };
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (verifyError) {
      return { error: 'Current password is incorrect.' };
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    return { error: updateError?.message ?? null };
  }

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    loading,
    signUp,
    signIn,
    signOut,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
