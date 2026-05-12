import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { randomUUID } from '../lib/uuid';

export type PantryMember = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: 'owner' | 'editor';
};

type RawProfile = { display_name: string | null; avatar_url: string | null };
type RawMember = { user_id: string; role: string; profile: RawProfile | RawProfile[] };

export function usePantryMembers(pantryId: string | undefined) {
  const [members, setMembers] = useState<PantryMember[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!pantryId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('pantry_members')
        .select('user_id, role, profile:profiles!user_id(display_name, avatar_url)')
        .eq('pantry_id', pantryId);

      const raw = (data ?? []) as unknown as RawMember[];
      setMembers(raw.map(m => {
        const p = Array.isArray(m.profile) ? m.profile[0] : m.profile;
        return {
          user_id: m.user_id,
          display_name: p?.display_name ?? null,
          avatar_url: p?.avatar_url ?? null,
          role: m.role as 'owner' | 'editor',
        };
      }));
    } finally {
      setLoading(false);
    }
  }, [pantryId]);

  const addMemberByUserId = useCallback(async (userId: string): Promise<string | null> => {
    if (!pantryId) return 'No pantry';
    const { error } = await supabase.from('pantry_members').insert({
      id: randomUUID(),
      pantry_id: pantryId,
      user_id: userId,
      role: 'editor',
    });
    if (error) return error.message;
    return null;
  }, [pantryId]);

  const removeMember = useCallback(async (userId: string): Promise<string | null> => {
    if (!pantryId) return 'No pantry';
    const { error } = await supabase
      .from('pantry_members')
      .delete()
      .eq('pantry_id', pantryId)
      .eq('user_id', userId);
    if (error) return error.message;
    setMembers(prev => prev.filter(m => m.user_id !== userId));
    return null;
  }, [pantryId]);

  return { members, loading, fetchMembers, addMemberByUserId, removeMember, setMembers };
}
