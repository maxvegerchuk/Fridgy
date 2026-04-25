import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '../types';

type AuthState = {
  user: Profile | null;
  email: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, displayName: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

// Build a Profile immediately from auth session metadata — no DB roundtrip needed.
// The real profile is fetched in the background and replaces this.
function quickProfile(authUser: User): Profile {
  return {
    id: authUser.id,
    display_name:
      (authUser.user_metadata?.['display_name'] as string | undefined) ??
      authUser.email ??
      'User',
    created_at: authUser.created_at,
  };
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data as unknown as Profile | null;
}

// Fetch full profile in background and silently update the store if it succeeds.
function syncProfile(userId: string) {
  fetchProfile(userId)
    .then((profile) => { if (profile) useAuthStore.setState({ user: profile }); })
    .catch(() => { /* quickProfile stays */ });
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  email: null,
  loading: true,

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    // Keep loading:true so ProtectedRoute waits for onAuthStateChange to deliver
    // the session before rendering. Without this, navigating to '/' while user is
    // still null causes an immediate redirect back to /login.
    set({ loading: true });
    return null;
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

// Safety valve: 3 s max — if auth never resolves (offline, content blocker, iOS quirk),
// unblock the UI so the user sees the login page instead of a permanent spinner.
const authTimeout = setTimeout(() => {
  if (useAuthStore.getState().loading) useAuthStore.setState({ loading: false });
}, 3000);

// getSession() is a plain async call that always resolves or rejects — the most reliable
// initial auth check across all browsers, including iOS Safari.
supabase.auth.getSession()
  .then(({ data: { session } }) => {
    clearTimeout(authTimeout);
    if (session?.user) {
      // Unblock the UI immediately using metadata; real profile arrives in background.
      useAuthStore.setState({
        user: quickProfile(session.user),
        email: session.user.email ?? null,
        loading: false,
      });
      syncProfile(session.user.id);
    } else {
      useAuthStore.setState({ loading: false });
    }
  })
  .catch(() => {
    clearTimeout(authTimeout);
    useAuthStore.setState({ loading: false });
  });

// onAuthStateChange handles every auth event after the initial check.
// INITIAL_SESSION is skipped — getSession() above already handles it.
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'INITIAL_SESSION') return;

  if (event === 'SIGNED_OUT' || !session?.user) {
    useAuthStore.setState({ user: null, email: null, loading: false });
    return;
  }

  // Unblock the UI immediately; full profile syncs in background.
  useAuthStore.setState({
    user: quickProfile(session.user),
    email: session.user.email ?? null,
    loading: false,
  });
  syncProfile(session.user.id);
});
