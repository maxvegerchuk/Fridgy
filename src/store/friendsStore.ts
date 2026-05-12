import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { randomUUID } from '../lib/uuid';
import { useAuthStore } from './authStore';
import type { Profile } from '../types';

export type Friend = Profile & { friendship_id: string };

type RawFriendRow = {
  id: string;
  profiles: Profile | Profile[];
};

type FriendsState = {
  friends: Friend[];
  loading: boolean;
  initialized: boolean;
  fetchFriends: () => Promise<void>;
  addFriend: (profile: Profile) => Promise<string | null>;
  removeFriend: (friendId: string) => Promise<string | null>;
};

export const useFriendsStore = create<FriendsState>((set) => ({
  friends: [],
  loading: false,
  initialized: false,

  fetchFriends: async () => {
    const { user } = useAuthStore.getState();
    const { loading: alreadyLoading } = useFriendsStore.getState();
    console.log('[friendsStore] fetchFriends called — user:', user?.id ?? 'null', '| alreadyLoading:', alreadyLoading);
    if (!user || alreadyLoading) return;
    set({ loading: true });

    const { data, error } = await supabase
      .from('user_friends')
      .select('id, profiles!friend_id(id, short_id, display_name, avatar_url, created_at)')
      .eq('user_id', user.id);

    console.log('[friendsStore] query result — data:', data, 'error:', error);

    if (!error && data) {
      const friends = (data as unknown as RawFriendRow[])
        .map(row => {
          const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
          if (!p) return null;
          return { ...p, friendship_id: row.id } as Friend;
        })
        .filter((f): f is Friend => !!f);
      console.log('[friendsStore] friends loaded:', friends);
      set({ friends, loading: false, initialized: true });
    } else {
      set({ loading: false, initialized: true });
    }
  },

  addFriend: async (profile: Profile) => {
    const { user } = useAuthStore.getState();
    if (!user) return 'Not authenticated';

    const { data: existing } = await supabase
      .from('user_friends')
      .select('id')
      .eq('user_id', user.id)
      .eq('friend_id', profile.id)
      .maybeSingle();

    const friendship_id = (existing as { id: string } | null)?.id ?? randomUUID();

    if (!existing) {
      const { error } = await supabase.from('user_friends').insert({
        id: friendship_id,
        user_id: user.id,
        friend_id: profile.id,
      });
      if (error) return error.message;

      await supabase.from('user_friends').upsert(
        { id: randomUUID(), user_id: profile.id, friend_id: user.id },
        { onConflict: 'user_id,friend_id', ignoreDuplicates: true },
      );
    }

    set(state => ({
      friends: state.friends.find(f => f.id === profile.id)
        ? state.friends
        : [...state.friends, { ...profile, friendship_id }],
    }));
    return null;
  },

  removeFriend: async (friendId: string) => {
    const { user } = useAuthStore.getState();
    if (!user) return 'Not authenticated';

    const { error } = await supabase
      .from('user_friends')
      .delete()
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

    if (error) return error.message;
    set(state => ({ friends: state.friends.filter(f => f.id !== friendId) }));
    return null;
  },
}));

// ── Auto-sync with auth state ────────────────────────────────────────────────
// Key insight: on page reload authStore starts { user: null, loading: true }.
// getSession() resolves async → loading becomes false. We must wait for that
// transition rather than comparing user null→non-null (which can fire twice
// due to the quickProfile → fullProfile sync in authStore).
useAuthStore.subscribe((state, prevState) => {
  const authJustResolved = prevState.loading && !state.loading;
  const userJustLoggedIn = !prevState.user && !!state.user && !state.loading;

  if ((authJustResolved || userJustLoggedIn) && state.user) {
    console.log('[friendsStore] auth resolved/login detected, fetching friends for', state.user.id);
    useFriendsStore.getState().fetchFriends();
  }

  if (prevState.user && !state.user) {
    console.log('[friendsStore] user logged out, clearing friends');
    useFriendsStore.setState({ friends: [], initialized: false, loading: false });
  }
});

// If auth already resolved before this module loaded (e.g. HMR / fast replay),
// fetch immediately.
const _boot = useAuthStore.getState();
console.log('[friendsStore] module loaded — loading:', _boot.loading, 'user:', _boot.user?.id ?? 'null');
if (!_boot.loading && _boot.user) {
  useFriendsStore.getState().fetchFriends();
}
