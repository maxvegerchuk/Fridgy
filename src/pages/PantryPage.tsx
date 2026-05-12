import { useState, useMemo, useEffect } from 'react';
import { ShoppingBagOpen, ShoppingCart, Plus, Trash, MagnifyingGlass, UserPlus, Check } from 'phosphor-react';
import { EmptyState, Button, Skeleton, BottomSheet } from '../components/ui';
import { useToast } from '../components/ui';
import AddPantrySheet from '../components/pantry/AddPantrySheet';
import AddToListSheet from '../components/pantry/AddToListSheet';
import { usePantry } from '../hooks/usePantry';
import { useFriendsStore } from '../store/friendsStore';
import { supabase } from '../lib/supabase';
import { randomUUID } from '../lib/uuid';
import { CATEGORIES } from '../types';
import type { ItemCategory, PantryItem } from '../types';

const CATEGORY_ORDER: ItemCategory[] = [
  'vegetables', 'fruits', 'dairy', 'meat', 'fish',
  'bakery', 'frozen', 'canned', 'drinks', 'snacks', 'household', 'other',
];

function groupByCategory(items: PantryItem[]): [ItemCategory, PantryItem[]][] {
  const map = new Map<ItemCategory, PantryItem[]>();
  for (const item of items) {
    const bucket = map.get(item.category) ?? [];
    bucket.push(item);
    map.set(item.category, bucket);
  }
  return CATEGORY_ORDER
    .filter(cat => map.has(cat))
    .map(cat => [cat, map.get(cat)!]);
}

type ViewMode = 'all' | 'categories';

export default function PantryPage() {
  const { pantry, items, loading, addItem, deleteItem, addToShoppingList } = usePantry();
  const { friends, initialized: friendsReady, fetchFriends } = useFriendsStore();
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    if (!friendsReady) fetchFriends();
  }, [friendsReady, fetchFriends]);
  const [addToListItem, setAddToListItem] = useState<PantryItem | null>(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<ViewMode>('all');
  const toast = useToast();

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [memberUserIds, setMemberUserIds] = useState<Set<string>>(new Set());
  const [selectedFriendIds, setSelectedFriendIds] = useState<Set<string>>(new Set());
  const [addingMembers, setAddingMembers] = useState(false);

  const availableFriends = friends.filter(f => !memberUserIds.has(f.id));

  const openAddMember = async () => {
    setAddMemberOpen(true);
    if (!pantry?.id) return;
    const { data } = await supabase.from('pantry_members').select('user_id').eq('pantry_id', pantry.id);
    if (data) setMemberUserIds(new Set((data as { user_id: string }[]).map(m => m.user_id)));
  };

  const closeAddMember = () => {
    setAddMemberOpen(false);
    setSelectedFriendIds(new Set());
    setMemberUserIds(new Set());
  };

  const toggleFriend = (id: string) => {
    setSelectedFriendIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAddSelected = async () => {
    if (!pantry || selectedFriendIds.size === 0) return;
    setAddingMembers(true);
    const rows = [...selectedFriendIds].map(uid => ({
      id: randomUUID(),
      pantry_id: pantry.id,
      user_id: uid,
      role: 'editor',
    }));
    const { error } = await supabase.from('pantry_members').insert(rows);
    setAddingMembers(false);
    if (error) {
      toast(error.message, 'error');
    } else {
      setMemberUserIds(prev => new Set([...prev, ...selectedFriendIds]));
      toast(`${selectedFriendIds.size} member${selectedFriendIds.size !== 1 ? 's' : ''} added`, 'success');
      closeAddMember();
    }
  };

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(item => item.name.toLowerCase().includes(q));
  }, [items, search]);

  const groups = groupByCategory(filteredItems);

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="flex items-center h-[80px] px-4 border-b border-neutral-100 flex-shrink-0 bg-white">
        <div className="flex-1 min-w-0">
          <h1 className="text-h2 font-heading text-neutral-900">Pantry</h1>
          <p className="text-body text-neutral-600 font-sans">Your home ingredients</p>
        </div>
        <button
          type="button"
          onClick={openAddMember}
          className="w-10 h-10 flex items-center justify-center rounded-md text-neutral-600 active:scale-95 active:bg-neutral-100 transition-all"
          aria-label="Add member"
        >
          <UserPlus size={22} weight="regular" />
        </button>
      </div>

      {/* Search + filter */}
      <div className="px-4 pt-3 pb-2 flex flex-col gap-2 border-b border-neutral-100 flex-shrink-0 bg-white">
        <div className="relative">
          <MagnifyingGlass
            size={18}
            weight="regular"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
          />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search ingredients"
            style={{ fontSize: '16px' }}
            className="w-full h-[44px] pl-9 pr-4 border border-neutral-200 rounded-md bg-neutral-0 text-body font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-neutral-400"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'categories'] as ViewMode[]).map(v => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`h-8 px-4 rounded-full text-body-sm font-medium font-sans transition-colors ${
                view === v
                  ? 'bg-green-500 text-white'
                  : 'bg-neutral-100 text-neutral-600 active:bg-neutral-200'
              }`}
            >
              {v === 'all' ? 'All' : 'Categories'}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="scroll-area">
        {loading && (
          <div className="flex flex-col gap-3 px-4 py-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-[80px] rounded-lg" />
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <EmptyState
            icon={<ShoppingBagOpen size={56} weight="light" />}
            title="Pantry is empty"
            description="Items move here automatically when you check them off your list, or add them manually"
            action={
              <Button size="md" onClick={() => setAddOpen(true)}>
                Add First Item
              </Button>
            }
          />
        )}

        {!loading && items.length > 0 && (
          <div className="pb-4">
            {/* Section header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <span className="text-badge font-semibold uppercase tracking-wide text-neutral-400 font-sans">
                All Ingredients
              </span>
              <span className="text-badge text-neutral-400 font-sans">
                {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {filteredItems.length === 0 && (
              <p className="text-body-sm text-neutral-400 text-center py-8 font-sans">No results</p>
            )}

            {view === 'all' && (
              <div className="flex flex-col gap-3">
                {filteredItems.map(item => (
                  <PantryItemRow
                    key={item.id}
                    item={item}
                    onAddToList={() => setAddToListItem(item)}
                    onDelete={deleteItem}
                  />
                ))}
              </div>
            )}

            {view === 'categories' && groups.map(([cat, catItems]) => (
              <div key={cat}>
                <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                  <span className="text-badge font-medium uppercase tracking-wider text-neutral-200 font-sans">
                    {CATEGORIES[cat].label}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {catItems.map(item => (
                    <PantryItemRow
                      key={item.id}
                      item={item}
                      onAddToList={() => setAddToListItem(item)}
                      onDelete={deleteItem}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={() => setAddOpen(true)}
        className="absolute bottom-6 right-4 w-14 h-14 bg-green-500 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Add item"
      >
        <Plus size={24} weight="bold" />
      </button>

      <AddPantrySheet
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onAddItem={async (newItem) => {
          const err = await addItem(newItem);
          if (err) {
            toast(`Could not add item: ${err}`, 'error');
          } else {
            toast(`${newItem.name} added to pantry`, 'success');
          }
        }}
      />

      <AddToListSheet
        item={addToListItem}
        onClose={() => setAddToListItem(null)}
        onConfirm={async (item, qty, unit) => {
          const err = await addToShoppingList(item, qty, unit);
          if (err) {
            toast(`Could not add to list: ${err}`, 'error');
          } else {
            toast(`${item.name} added to list`, 'success');
          }
        }}
      />

      {/* Add member sheet */}
      <BottomSheet isOpen={addMemberOpen} onClose={closeAddMember} title="Add Member">
        <div className="flex flex-col gap-3">
          {availableFriends.length === 0 ? (
            <p className="text-body-sm text-neutral-400 text-center py-8 font-sans">
              {friends.length === 0 ? 'Add friends in your Profile first' : 'All friends are already members'}
            </p>
          ) : (
            availableFriends.map(f => {
              const selected = selectedFriendIds.has(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggleFriend(f.id)}
                  className="flex items-center gap-3 px-4 py-3 bg-white border border-neutral-100 rounded-md active:bg-neutral-50 active:scale-[0.99] transition-all"
                >
                  <div className={[
                    'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                    selected ? 'bg-green-500 border-green-500' : 'bg-white border-neutral-200',
                  ].join(' ')}>
                    {selected && <Check size={12} weight="bold" className="text-white" />}
                  </div>
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-body-sm font-bold text-green-700 font-sans">
                      {f.display_name?.charAt(0).toUpperCase() ?? '?'}
                    </span>
                  </div>
                  <p className="flex-1 text-body-sm font-semibold text-neutral-900 font-sans text-left truncate">
                    {f.display_name}
                  </p>
                </button>
              );
            })
          )}
          <div className="flex gap-3 pt-1 mt-1 border-t border-neutral-100">
            <Button variant="secondary" size="md" fullWidth onClick={closeAddMember}>Cancel</Button>
            <Button
              size="md"
              fullWidth
              disabled={selectedFriendIds.size === 0}
              loading={addingMembers}
              onClick={handleAddSelected}
            >
              {selectedFriendIds.size > 0 ? `Add (${selectedFriendIds.size})` : 'Add'}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

type ItemRowProps = {
  item: PantryItem;
  onAddToList: () => void;
  onDelete: (id: string) => Promise<void>;
};

function PantryItemRow({ item, onAddToList, onDelete }: ItemRowProps) {
  return (
    <div className="flex items-center gap-3 px-4">
      {/* Image placeholder */}
      <div className="w-16 h-16 rounded-md bg-white border border-neutral-100 flex-shrink-0" />

      {/* Name + qty */}
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-semibold text-neutral-900 font-sans truncate">{item.name}</p>
        {(item.quantity || item.unit) && (
          <p className="text-badge text-neutral-400 font-sans mt-0.5">
            {[item.quantity, item.unit].filter(Boolean).join(' ')}
          </p>
        )}
      </div>

      {/* Add to shopping list */}
      <button
        type="button"
        onClick={onAddToList}
        className="w-10 h-10 flex items-center justify-center rounded-md text-neutral-400 active:scale-95 active:bg-neutral-100 transition-all flex-shrink-0"
        aria-label={`Add ${item.name} to shopping list`}
      >
        <ShoppingCart size={20} weight="regular" />
      </button>

      {/* Delete from pantry */}
      <button
        type="button"
        onClick={() => onDelete(item.id)}
        className="w-10 h-10 flex items-center justify-center rounded-md text-neutral-400 active:scale-95 active:text-red-700 active:bg-red-50 transition-all flex-shrink-0"
        aria-label={`Remove ${item.name} from pantry`}
      >
        <Trash size={20} weight="regular" />
      </button>
    </div>
  );
}
