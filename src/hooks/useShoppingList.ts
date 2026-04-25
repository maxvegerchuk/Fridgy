import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { ShoppingList, ListItem, ItemCategory } from '../types';

export type NewListItem = {
  name: string;
  quantity?: number;
  unit?: string;
  category: ItemCategory;
};

export function useShoppingList() {
  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(state => state.user);

  // Find or auto-create the user's active shopping list
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function init() {
      if (!user) return;
      setLoading(true);

      const { data: lists } = await supabase
        .from('shopping_lists')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1);

      let targetList: ShoppingList | null = null;

      if (lists && lists.length > 0) {
        targetList = lists[0] as ShoppingList;
      } else {
        // Generate a client-side ID to avoid the RLS chicken-and-egg problem:
        // INSERT returns nothing until list_members is also populated.
        const newId = crypto.randomUUID();
        const { error: listErr } = await supabase
          .from('shopping_lists')
          .insert({ id: newId, owner_id: user.id, name: 'Shopping List' });

        if (!listErr) {
          await supabase
            .from('list_members')
            .insert({ list_id: newId, user_id: user.id, role: 'owner' });

          const { data: created } = await supabase
            .from('shopping_lists')
            .select('*')
            .eq('id', newId)
            .single();

          if (created) targetList = created as ShoppingList;
        }
      }

      if (cancelled) return;

      if (!targetList) {
        setLoading(false);
        return;
      }

      setList(targetList);

      const { data: itemData } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', targetList.id)
        .order('created_at', { ascending: true });

      if (!cancelled) {
        setItems((itemData as ListItem[]) ?? []);
        setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Realtime — spec §11
  useEffect(() => {
    if (!list?.id) return;

    const channel = supabase
      .channel(`list-${list.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'list_items', filter: `list_id=eq.${list.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const incoming = payload.new as ListItem;
            setItems(prev =>
              prev.some(i => i.id === incoming.id) ? prev : [...prev, incoming]
            );
          }
          if (payload.eventType === 'UPDATE') {
            setItems(prev =>
              prev.map(i => i.id === (payload.new as ListItem).id ? payload.new as ListItem : i)
            );
          }
          if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id: string }).id;
            setItems(prev => prev.filter(i => i.id !== oldId));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [list?.id]);

  const addItem = useCallback(async (newItem: NewListItem): Promise<void> => {
    if (!list || !user) return;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const optimistic: ListItem = {
      id,
      list_id: list.id,
      name: newItem.name,
      quantity: newItem.quantity,
      unit: newItem.unit,
      category: newItem.category,
      is_checked: false,
      added_by: user.id,
      created_at: now,
      updated_at: now,
    };

    setItems(prev => [...prev, optimistic]);

    const { error } = await supabase.from('list_items').insert({
      id,
      list_id: list.id,
      name: newItem.name,
      quantity: newItem.quantity ?? null,
      unit: newItem.unit ?? null,
      category: newItem.category,
      added_by: user.id,
    });

    if (error) {
      setItems(prev => prev.filter(i => i.id !== id));
    }
  }, [list, user]);

  const checkItem = useCallback(async (id: string, checked: boolean): Promise<void> => {
    // Optimistic
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_checked: checked } : i));

    const { error } = await supabase
      .from('list_items')
      .update({ is_checked: checked })
      .eq('id', id);

    if (error) {
      // Rollback
      setItems(prev => prev.map(i => i.id === id ? { ...i, is_checked: !checked } : i));
    }
    // On success the DB trigger auto-moves item → pantry + purchase_history
  }, []);

  const deleteItem = useCallback(async (id: string): Promise<void> => {
    setItems(prev => prev.filter(i => i.id !== id));
    await supabase.from('list_items').delete().eq('id', id);
  }, []);

  return { list, items, loading, addItem, checkItem, deleteItem };
}
