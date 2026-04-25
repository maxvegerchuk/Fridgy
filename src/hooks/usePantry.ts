import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { randomUUID } from '../lib/uuid';
import type { Pantry, PantryItem, ItemCategory } from '../types';

export type NewPantryItem = {
  name: string;
  quantity?: number;
  unit?: string;
  category: ItemCategory;
};

async function resolveOrCreatePantryId(userId: string): Promise<string | null> {
  // Try the SECURITY DEFINER RPC first (bypasses RLS)
  const { data: pantryId, error: rpcErr } = await supabase.rpc('my_pantry_id');
  console.log('[usePantry] my_pantry_id() =', pantryId, rpcErr ?? 'ok');

  if (pantryId) return pantryId as string;

  // Pantry missing — create it manually.
  // The "System creates pantry (via trigger)" policy allows owner_id = auth.uid().
  console.warn('[usePantry] pantry not found for user', userId, '— creating now');
  const { error: createErr } = await supabase
    .from('pantries')
    .insert({ owner_id: userId });

  if (createErr) {
    console.error('[usePantry] pantry creation failed:', createErr);
    return null;
  }

  // Re-fetch after creation
  const { data: newId, error: refetchErr } = await supabase.rpc('my_pantry_id');
  console.log('[usePantry] re-fetch after create =', newId, refetchErr ?? 'ok');
  return (newId as string) ?? null;
}

export function usePantry() {
  const [pantry, setPantry] = useState<Pantry | null>(null);
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    async function init() {
      if (!user) return;
      setLoading(true);

      try {
        const pantryId = await resolveOrCreatePantryId(user.id);
        if (!pantryId || cancelled) return;

        // Bootstrap pantry_members for the owner (idempotent)
        const { error: memberErr } = await supabase.from('pantry_members').upsert(
          { pantry_id: pantryId, user_id: user.id, role: 'owner' },
          { onConflict: 'pantry_id,user_id', ignoreDuplicates: true }
        );
        if (memberErr) console.error('[usePantry] pantry_members upsert:', memberErr);

        if (cancelled) return;

        const [pantryRes, itemsRes] = await Promise.all([
          supabase.from('pantries').select('*').eq('id', pantryId).single(),
          supabase.from('pantry_items').select('*').eq('pantry_id', pantryId).order('created_at', { ascending: false }),
        ]);

        if (pantryRes.error) console.error('[usePantry] pantry fetch:', pantryRes.error);
        if (itemsRes.error) console.error('[usePantry] items fetch:', itemsRes.error);

        if (cancelled) return;
        if (pantryRes.data) setPantry(pantryRes.data as Pantry);
        setItems((itemsRes.data as PantryItem[]) ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Realtime subscription — fires when trigger inserts items (e.g. from checked list item)
  useEffect(() => {
    if (!pantry?.id) return;

    const channel = supabase
      .channel(`pantry-items-${pantry.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pantry_items', filter: `pantry_id=eq.${pantry.id}` },
        (payload) => {
          console.log('[usePantry] realtime event', payload.eventType, payload.new ?? payload.old);
          if (payload.eventType === 'INSERT') {
            const incoming = payload.new as PantryItem;
            setItems(prev => prev.some(i => i.id === incoming.id) ? prev : [incoming, ...prev]);
          }
          if (payload.eventType === 'UPDATE') {
            setItems(prev => prev.map(i => i.id === (payload.new as PantryItem).id ? payload.new as PantryItem : i));
          }
          if (payload.eventType === 'DELETE') {
            setItems(prev => prev.filter(i => i.id !== (payload.old as { id: string }).id));
          }
        }
      )
      .subscribe((status, err) => {
        console.log('[usePantry] realtime status:', status, err ?? 'ok');
        if (err) console.error('[usePantry] realtime error:', err);
      });

    return () => { supabase.removeChannel(channel); };
  }, [pantry?.id]);

  // Pull-refresh: called after external events (e.g. list item checked) to sync pantry
  const refetch = useCallback(async () => {
    if (!pantry?.id) return;
    const { data, error } = await supabase
      .from('pantry_items')
      .select('*')
      .eq('pantry_id', pantry.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[usePantry] refetch error:', error);
      return;
    }
    setItems((data as PantryItem[]) ?? []);
  }, [pantry?.id]);

  // Returns null on success, error message on failure
  const addItem = useCallback(async (newItem: NewPantryItem): Promise<string | null> => {
    if (!pantry) {
      console.error('[usePantry] addItem called but pantry is null');
      return 'Pantry not loaded — please refresh';
    }
    if (!user) return 'Not logged in';

    const id = randomUUID();
    const now = new Date().toISOString();
    const optimistic: PantryItem = {
      id,
      pantry_id: pantry.id,
      name: newItem.name,
      quantity: newItem.quantity,
      unit: newItem.unit,
      category: newItem.category,
      source: 'manual',
      added_by: user.id,
      created_at: now,
      updated_at: now,
    };

    setItems(prev => [optimistic, ...prev]);

    const { error } = await supabase.from('pantry_items').insert({
      id,
      pantry_id: pantry.id,
      name: newItem.name,
      quantity: newItem.quantity ?? null,
      unit: newItem.unit ?? null,
      category: newItem.category,
      source: 'manual',
      added_by: user.id,
    });

    if (error) {
      console.error('[usePantry] addItem insert failed:', error);
      setItems(prev => prev.filter(i => i.id !== id));
      return error.message;
    }
    return null;
  }, [pantry, user]);

  const deleteItem = useCallback(async (id: string): Promise<void> => {
    setItems(prev => prev.filter(i => i.id !== id));
    const { error } = await supabase.from('pantry_items').delete().eq('id', id);
    if (error) {
      console.error('[usePantry] deleteItem failed:', error);
      // No rollback needed — item is gone from pantry either way
    }
  }, []);

  const addToShoppingList = useCallback(async (
    item: PantryItem,
    overrideQuantity?: number,
    overrideUnit?: string,
  ): Promise<string | null> => {
    if (!user) return 'Not logged in';

    const { data: lists, error: listErr } = await supabase
      .from('shopping_lists')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1);

    if (listErr) {
      console.error('[usePantry] addToShoppingList — list fetch failed:', listErr);
      return listErr.message;
    }
    if (!lists || lists.length === 0) return 'No shopping list found';

    const { error: insertErr } = await supabase.from('list_items').insert({
      id: randomUUID(),
      list_id: lists[0].id,
      name: item.name,
      quantity: overrideQuantity ?? item.quantity ?? null,
      unit: overrideUnit ?? item.unit ?? null,
      category: item.category,
      added_by: user.id,
    });

    if (insertErr) {
      console.error('[usePantry] addToShoppingList — insert failed:', insertErr);
      return insertErr.message;
    }
    return null;
  }, [user]);

  return { pantry, items, loading, addItem, deleteItem, addToShoppingList, refetch };
}
