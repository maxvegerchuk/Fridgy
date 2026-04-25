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

// Resolve initial session then stay subscribed for all future auth events
supabase.auth.getSession().then(async ({ data: { session } }) => {
  if (session?.user) {
    try {
      const profile = await fetchProfile(session.user.id);
      useAuthStore.setState({ user: profile, email: session.user.email ?? null, loading: false });
    } catch {
      useAuthStore.setState({ loading: false });
    }
  } else {
    useAuthStore.setState({ loading: false });
  }
});

supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_OUT' || !session?.user) {
    useAuthStore.setState({ user: null, email: null, loading: false });
    return;
  }
  try {
    const profile = await fetchProfile(session.user.id);
    useAuthStore.setState({ user: profile, email: session.user.email ?? null, loading: false });
  } catch {
    useAuthStore.setState({ loading: false });
  }
});
