import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

type AuthState = {
  user: Profile | null;
  email: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, displayName: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data as unknown as Profile | null;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  email: null,
  loading: true,

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  },

  signUp: async (email, password, displayName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    return error?.message ?? null;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, email: null });
  },
}));

// Safety valve: if auth never resolves (network offline, content blocker, iOS quirk),
// unblock the UI after 8 seconds so the user sees the login page instead of a spinner.
const authTimeout = setTimeout(() => {
  if (useAuthStore.getState().loading) {
    useAuthStore.setState({ loading: false });
  }
}, 8000);

// onAuthStateChange fires INITIAL_SESSION synchronously on subscription with the stored
// session, covering both "first load" and all subsequent auth events. No need for
// getSession() which would fire a redundant concurrent fetchProfile call.
supabase.auth.onAuthStateChange(async (event, session) => {
  // Clear the safety timeout on first real auth event
  clearTimeout(authTimeout);

  if (event === 'SIGNED_OUT' || !session?.user) {
    useAuthStore.setState({ user: null, email: null, loading: false });
    return;
  }
  try {
    const profile = await fetchProfile(session.user.id);
    useAuthStore.setState({ user: profile, email: session.user.email ?? null, loading: false });
  } catch {
    // Profile fetch failed (RLS, network) — still unblock the UI
    useAuthStore.setState({ loading: false });
  }
});
