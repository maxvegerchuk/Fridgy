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
        // SECURITY DEFINER — bypasses RLS to return the pantry UUID
        const { data: pantryId } = await supabase.rpc('my_pantry_id');
        if (!pantryId || cancelled) return;

        // Bootstrap pantry_members for the owner (idempotent)
        await supabase.from('pantry_members').upsert(
          { pantry_id: pantryId as string, user_id: user.id, role: 'owner' },
          { onConflict: 'pantry_id,user_id', ignoreDuplicates: true }
        );

        if (cancelled) return;

        const [pantryRes, itemsRes] = await Promise.all([
          supabase.from('pantries').select('*').eq('id', pantryId as string).single(),
          supabase.from('pantry_items').select('*').eq('pantry_id', pantryId as string).order('created_at', { ascending: false }),
        ]);

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

  // Realtime
  useEffect(() => {
    if (!pantry?.id) return;

    const channel = supabase
      .channel(`pantry-items-${pantry.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pantry_items', filter: `pantry_id=eq.${pantry.id}` },
        (payload) => {
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
        if (err) console.warn('[pantry realtime]', status, err);
      });

    return () => { supabase.removeChannel(channel); };
  }, [pantry?.id]);

  const addItem = useCallback(async (newItem: NewPantryItem): Promise<void> => {
    if (!pantry || !user) return;

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

    if (error) setItems(prev => prev.filter(i => i.id !== id));
  }, [pantry, user]);

  const deleteItem = useCallback(async (id: string): Promise<void> => {
    setItems(prev => prev.filter(i => i.id !== id));
    await supabase.from('pantry_items').delete().eq('id', id);
  }, []);

  const addToShoppingList = useCallback(async (item: PantryItem): Promise<void> => {
    if (!user) return;

    const { data: lists } = await supabase
      .from('shopping_lists')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1);

    if (!lists || lists.length === 0) return;

    await supabase.from('list_items').insert({
      id: randomUUID(),
      list_id: lists[0].id,
      name: item.name,
      quantity: item.quantity ?? null,
      unit: item.unit ?? null,
      category: item.category,
      added_by: user.id,
    });
  }, [user]);

  return { pantry, items, loading, addItem, deleteItem, addToShoppingList };
}
