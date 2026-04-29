import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { randomUUID } from '../lib/uuid';
import type { Profile } from '../types';

export type Friend = Profile & { friendship_id: string };

export function useFriends() {
  const { user } = useAuthStore();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const { data, error } = await supabase
      .from('user_friends')
      .select('id, user_id, friend_id, profiles!friend_id(id, display_name, avatar_url, created_at)')
      .eq('user_id', user.id);

    if (!error && data) {
      setFriends(
        (data as unknown as Array<{ id: string; friend_id: string; profiles: Profile | Profile[] }>)
          .map(row => {
            const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
            if (!p) return null;
            return { ...p, friendship_id: row.id } as Friend;
          })
          .filter((f): f is Friend => !!f)
      );
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchFriends(); }, [fetchFriends]);

  const addFriend = useCallback(async (profile: Profile): Promise<string | null> => {
    if (!user) return 'Not authenticated';
    const forward = { id: randomUUID(), user_id: user.id, friend_id: profile.id };
    const reverse = { id: randomUUID(), user_id: profile.id, friend_id: user.id };

    const { error } = await supabase.from('user_friends').insert(forward);
    if (error) return error.message;

    // Best-effort reverse row — ignore duplicate errors
    await supabase.from('user_friends').insert(reverse);

    setFriends(prev => [...prev, { ...profile, friendship_id: forward.id }]);
    return null;
  }, [user?.id]);

  const removeFriend = useCallback(async (friendId: string): Promise<string | null> => {
    if (!user) return 'Not authenticated';

    const { error } = await supabase
      .from('user_friends')
      .delete()
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

    if (error) return error.message;
    setFriends(prev => prev.filter(f => f.id !== friendId));
    return null;
  }, [user?.id]);

  return { friends, loading, addFriend, removeFriend, refetch: fetchFriends };
}
