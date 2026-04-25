import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { PurchaseHistoryItem } from '../types';

export function usePurchaseHistory(listId: string | null) {
  const [history, setHistory] = useState<PurchaseHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function init() {
      if (!user) return;
      setLoading(true);

      // my_pantry_id() is SECURITY DEFINER — bypasses RLS to return the pantry UUID
      const { data: pantryId } = await supabase.rpc('my_pantry_id');
      if (!pantryId || cancelled) {
        setLoading(false);
        return;
      }

      // Ensure user is in pantry_members for their own pantry.
      // The INSERT policy "Join pantry (insert self)" allows this.
      // ignoreDuplicates:true → ON CONFLICT DO NOTHING (idempotent)
      await supabase.from('pantry_members').upsert(
        { pantry_id: pantryId as string, user_id: user.id, role: 'owner' },
        { onConflict: 'pantry_id,user_id', ignoreDuplicates: true }
      );

      const { data } = await supabase
        .from('purchase_history')
        .select('*')
        .eq('pantry_id', pantryId as string)
        .order('last_purchased_at', { ascending: false });

      if (!cancelled) {
        setHistory((data as PurchaseHistoryItem[]) ?? []);
        setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [user?.id]);

  const addToList = useCallback(async (item: PurchaseHistoryItem): Promise<void> => {
    if (!listId || !user) return;
    await supabase.from('list_items').insert({
      id: crypto.randomUUID(),
      list_id: listId,
      name: item.name,
      quantity: item.quantity ?? null,
      unit: item.unit ?? null,
      category: item.category,
      added_by: user.id,
    });
  }, [listId, user]);

  return { history, loading, addToList };
}
