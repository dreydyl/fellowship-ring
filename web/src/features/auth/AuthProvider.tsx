// Authentication provider: exposes the current Supabase auth session
// and user to the rest of the application via React context.
//
// TODO: Implement session loading, sign-in/sign-out methods, and
// subscribe to Supabase auth state changes.

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';

interface AuthContextValue {
  session: Session | null;
  // TODO: signIn, signOut, etc.
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session] = useState<Session | null>(null);

  // TODO: Subscribe to supabase.auth.onAuthStateChange and update session.

  return (
    <AuthContext.Provider value={{ session }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
