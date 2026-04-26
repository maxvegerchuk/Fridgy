import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { randomUUID } from '../lib/uuid';
import type { ShoppingList, ListItem, ItemCategory } from '../types';

export type NewListItem = {
  name: string;
  quantity?: number;
  unit?: string;
  category: ItemCategory;
};

export type ListSummary = {
  id: string;
  name: string;
  owner_id: string;
  invite_token: string;
  created_at: string;
  role: 'owner' | 'editor';
  item_count: number;
  members: Array<{
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    role: 'owner' | 'editor';
  }>;
};

// ─── Single-list detail hook ──────────────────────────────

export function useShoppingList(listId: string | undefined) {
  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (!listId || !user) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    async function init() {
      setLoading(true);
      try {
        const { data: listData } = await supabase
          .from('shopping_lists')
          .select('*')
          .eq('id', listId)
          .single();

        if (cancelled) return;

        if (listData) {
          setList(listData as ShoppingList);
          const { data: itemData } = await supabase
            .from('list_items')
            .select('*')
            .eq('list_id', listId)
            .order('created_at', { ascending: true });
          if (!cancelled) setItems((itemData as ListItem[]) ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [listId, user?.id]);

  // Realtime
  useEffect(() => {
    if (!listId) return;

    const channel = supabase
      .channel(`list-${listId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'list_items', filter: `list_id=eq.${listId}` },
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
      .subscribe((status, err) => {
        if (err) console.warn('[realtime] subscription error', status, err);
      });

    return () => { supabase.removeChannel(channel); };
  }, [listId]);

  const addItem = useCallback(async (newItem: NewListItem): Promise<void> => {
    if (!listId || !user) return;

    const id = randomUUID();
    const now = new Date().toISOString();
    const optimistic: ListItem = {
      id,
      list_id: listId,
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
      list_id: listId,
      name: newItem.name,
      quantity: newItem.quantity ?? null,
      unit: newItem.unit ?? null,
      category: newItem.category,
      added_by: user.id,
    });

    if (error) {
      setItems(prev => prev.filter(i => i.id !== id));
    }
  }, [listId, user]);

  const checkItem = useCallback(async (
    id: string,
    checked: boolean,
    onChecked?: () => void,
  ): Promise<void> => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_checked: checked } : i));

    const { error } = await supabase
      .from('list_items')
      .update({ is_checked: checked })
      .eq('id', id);

    if (error) {
      console.error('[useShoppingList] checkItem failed:', error);
      setItems(prev => prev.map(i => i.id === id ? { ...i, is_checked: !checked } : i));
      return;
    }

    if (checked) onChecked?.();
  }, []);

  const deleteItem = useCallback(async (id: string): Promise<void> => {
    setItems(prev => prev.filter(i => i.id !== id));
    await supabase.from('list_items').delete().eq('id', id);
  }, []);

  return { list, items, loading, addItem, checkItem, deleteItem };
}

// ─── Lists overview hook ──────────────────────────────────

export function useShoppingLists() {
  const [myLists, setMyLists] = useState<ListSummary[]>([]);
  const [sharedLists, setSharedLists] = useState<ListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(state => state.user);

  const fetchLists = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: memberships } = await supabase
        .from('list_members')
        .select('list_id, role')
        .eq('user_id', user.id);

      const listIds = (memberships ?? []).map((m: { list_id: string; role: string }) => m.list_id);

      if (listIds.length === 0) {
        setMyLists([]);
        setSharedLists([]);
        return;
      }

      const roleMap = new Map(
        (memberships ?? []).map((m: { list_id: string; role: string }) => [m.list_id, m.role as 'owner' | 'editor'])
      );

      const [listsRes, itemsRes, membersRes] = await Promise.all([
        supabase
          .from('shopping_lists')
          .select('*')
          .in('id', listIds)
          .order('created_at', { ascending: false }),
        supabase
          .from('list_items')
          .select('list_id')
          .in('list_id', listIds)
          .eq('is_checked', false),
        supabase
          .from('list_members')
          .select('list_id, user_id, role, profile:profiles!user_id(display_name, avatar_url)')
          .in('list_id', listIds),
      ]);

      const itemCountMap = new Map<string, number>();
      for (const item of (itemsRes.data ?? []) as { list_id: string }[]) {
        itemCountMap.set(item.list_id, (itemCountMap.get(item.list_id) ?? 0) + 1);
      }

      type RawMember = {
        list_id: string;
        user_id: string;
        role: string;
        profile: { display_name: string | null; avatar_url: string | null } | null;
      };

      const membersMap = new Map<string, RawMember[]>();
      for (const m of (membersRes.data ?? []) as RawMember[]) {
        const arr = membersMap.get(m.list_id) ?? [];
        arr.push(m);
        membersMap.set(m.list_id, arr);
      }

      const summaries: ListSummary[] = ((listsRes.data ?? []) as ShoppingList[]).map(list => ({
        id: list.id,
        name: list.name,
        owner_id: list.owner_id,
        invite_token: list.invite_token,
        created_at: list.created_at,
        role: roleMap.get(list.id) ?? 'editor',
        item_count: itemCountMap.get(list.id) ?? 0,
        members: (membersMap.get(list.id) ?? []).map(m => ({
          user_id: m.user_id,
          display_name: m.profile?.display_name ?? null,
          avatar_url: m.profile?.avatar_url ?? null,
          role: m.role as 'owner' | 'editor',
        })),
      }));

      setMyLists(summaries.filter(s => s.owner_id === user.id));
      setSharedLists(summaries.filter(s => s.owner_id !== user.id));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const createList = useCallback(async (name: string): Promise<string | null> => {
    if (!user) return null;
    const id = randomUUID();

    const { error: listErr } = await supabase
      .from('shopping_lists')
      .insert({ id, owner_id: user.id, name });

    if (listErr) { console.error('[useShoppingLists] createList:', listErr); return null; }

    await supabase
      .from('list_members')
      .insert({ list_id: id, user_id: user.id, role: 'owner' });

    await fetchLists();
    return id;
  }, [user, fetchLists]);

  const deleteList = useCallback(async (id: string): Promise<void> => {
    setMyLists(prev => prev.filter(l => l.id !== id));
    const { error } = await supabase.from('shopping_lists').delete().eq('id', id);
    if (error) {
      console.error('[useShoppingLists] deleteList:', error);
      fetchLists();
    }
  }, [fetchLists]);

  return { myLists, sharedLists, loading, createList, deleteList, refetch: fetchLists };
}
