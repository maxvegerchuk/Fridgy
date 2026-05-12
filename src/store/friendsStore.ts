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
    console.log('[fetchFriends] called');
    const { data: { user } } = await supabase.auth.getUser();
    console.log('[fetchFriends] user:', user?.id ?? 'NULL');
    if (!user) return;

    set({ loading: true });

    const { data: friendLinks, error: linksError } = await supabase
      .from('user_friends')
      .select('friend_id')
      .eq('user_id', user.id);

    console.log('[fetchFriends] friendLinks:', friendLinks, 'error:', linksError);

    if (linksError || !friendLinks?.length) {
      set({ friends: [], initialized: true, loading: false });
      return;
    }

    const friendIds = friendLinks.map((f: { friend_id: string }) => f.friend_id);

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, short_id')
      .in('id', friendIds);

    console.log('[fetchFriends] profiles:', profiles, 'error:', profilesError);

    if (profilesError) {
      set({ loading: false });
      return;
    }

    const friends = (profiles ?? []) as Profile[];
    console.log('[fetchFriends] friends set:', friends.length);
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
