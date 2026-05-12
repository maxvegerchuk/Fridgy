import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { randomUUID } from '../lib/uuid';
import { useAuthStore } from './authStore';
import type { Profile } from '../types';

export type Friend = Profile & { friendship_id: string };


type FriendsState = {
  friends: Profile[];
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    set({ loading: true });

    const { data, error } = await supabase
      .from('user_friends')
      .select(`
        friend_id,
        profiles!friend_id (
          id,
          display_name,
          avatar_url,
          short_id
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('[friendsStore] fetch error:', error);
      set({ loading: false });
      return;
    }

    const friends = ((data ?? []) as unknown as { profiles: Profile | null }[])
      .map(row => row.profiles)
      .filter((p): p is Profile => !!p);

    set({ friends, initialized: true, loading: false });
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
        : [...state.friends, profile],
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

// Clear friends on logout so stale data never leaks between accounts.
useAuthStore.subscribe((state, prevState) => {
  if (prevState.user && !state.user) {
    useFriendsStore.setState({ friends: [], initialized: false, loading: false });
  }
});
