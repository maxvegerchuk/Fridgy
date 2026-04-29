import { useState, useMemo } from 'react';
import { ShoppingBagOpen, ShoppingCart, Plus, Trash, MagnifyingGlass, UserPlus, Check } from 'phosphor-react';
import { EmptyState, Button, Skeleton, BottomSheet } from '../components/ui';
import { useToast } from '../components/ui';
import AddPantrySheet from '../components/pantry/AddPantrySheet';
import AddToListSheet from '../components/pantry/AddToListSheet';
import { usePantry } from '../hooks/usePantry';
import { useFriends } from '../hooks/useFriends';
import { supabase } from '../lib/supabase';
import { randomUUID } from '../lib/uuid';
import { CATEGORIES } from '../types';
import type { ItemCategory, PantryItem, Profile } from '../types';

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
  const { friends } = useFriends();
  const [addOpen, setAddOpen] = useState(false);
  const [addToListItem, setAddToListItem] = useState<PantryItem | null>(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<ViewMode>('all');
  const toast = useToast();

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [memberUserIds, setMemberUserIds] = useState<Set<string>>(new Set());
  const [memberIdInput, setMemberIdInput] = useState('');
  const [foundProfile, setFoundProfile] = useState<Profile | null>(null);
  const [memberNotFound, setMemberNotFound] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [addingMember, setAddingMember] = useState(false);

  const openAddMember = async () => {
    setAddMemberOpen(true);
    if (!pantry?.id) return;
    const { data } = await supabase.from('pantry_members').select('user_id').eq('pantry_id', pantry.id);
    if (data) setMemberUserIds(new Set((data as { user_id: string }[]).map(m => m.user_id)));
  };

  const handleLookupUser = async () => {
    const raw = memberIdInput.trim();
    if (!raw) return;
    setLookingUp(true);
    setFoundProfile(null);
    setMemberNotFound(false);
    const { data } = await supabase.rpc('find_user_by_short_id', { p_prefix: raw });
    const profile = (Array.isArray(data) ? data[0] : data) as Profile | null;
    setLookingUp(false);
    if (profile) setFoundProfile(profile);
    else setMemberNotFound(true);
  };

  const handleAddMember = async () => {
    if (!foundProfile || !pantry) return;
    setAddingMember(true);
    const { error } = await supabase.from('pantry_members').insert({
      id: randomUUID(),
      pantry_id: pantry.id,
      user_id: foundProfile.id,
      role: 'editor',
    });
    setAddingMember(false);
    if (error) {
      toast(error.message, 'error');
    } else {
      setMemberUserIds(prev => new Set([...prev, foundProfile.id]));
      toast(`${foundProfile.display_name} added to pantry`, 'success');
      closeAddMember();
    }
  };

  const closeAddMember = () => {
    setAddMemberOpen(false);
    setMemberIdInput('');
    setFoundProfile(null);
    setMemberNotFound(false);
    setMemberUserIds(new Set());
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
      <div className="flex items-center justify-between h-[56px] px-4 border-b border-neutral-100 flex-shrink-0 bg-white">
        <h1 className="text-2xl font-semibold text-neutral-900 font-display">Pantry</h1>
        <button
          type="button"
          onClick={openAddMember}
          className="w-10 h-10 flex items-center justify-center rounded-md text-neutral-500 active:scale-95 active:bg-neutral-100 transition-all"
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
            className="w-full h-[44px] pl-9 pr-4 border border-neutral-200 rounded-md bg-neutral-0 text-sm font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-neutral-400"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'categories'] as ViewMode[]).map(v => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`h-8 px-4 rounded-full text-sm font-medium font-sans transition-colors ${
                view === v
                  ? 'bg-green-500 text-white'
                  : 'bg-[#F4F5F7] text-neutral-500 active:bg-neutral-200'
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
              <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 font-sans">
                All Ingredients
              </span>
              <span className="text-xs text-neutral-400 font-sans">
                {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {filteredItems.length === 0 && (
              <p className="text-sm text-neutral-400 text-center py-8 font-sans">No results</p>
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
                  <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-300 font-sans">
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
        <div className="flex flex-col gap-4">
          {/* Friends quick-add */}
          {friends.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 font-sans">Friends</p>
              {friends.map(f => {
                const isMember = memberUserIds.has(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    disabled={isMember}
                    onClick={isMember ? undefined : async () => {
                      if (!pantry) return;
                      const { error } = await supabase.from('pantry_members').insert({
                        id: randomUUID(),
                        pantry_id: pantry.id,
                        user_id: f.id,
                        role: 'editor',
                      });
                      if (error) toast(error.message, 'error');
                      else {
                        setMemberUserIds(prev => new Set([...prev, f.id]));
                        toast(`${f.display_name} added to pantry`, 'success');
                      }
                    }}
                    className={[
                      'flex items-center gap-3 px-4 py-3 bg-white border border-neutral-100 rounded-md transition-all',
                      isMember ? 'opacity-60' : 'active:bg-neutral-50 active:scale-[0.99]',
                    ].join(' ')}
                  >
                    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-green-600 font-sans">
                        {f.display_name?.charAt(0).toUpperCase() ?? '?'}
                      </span>
                    </div>
                    <p className="flex-1 text-sm font-semibold text-neutral-900 font-sans text-left truncate">{f.display_name}</p>
                    {isMember
                      ? <Check size={18} weight="bold" className="text-green-500 flex-shrink-0" />
                      : <UserPlus size={18} className="text-neutral-400 flex-shrink-0" />
                    }
                  </button>
                );
              })}
              <div className="border-t border-neutral-100 mt-1" />
            </div>
          )}

          {/* Manual ID lookup */}
          <div className="flex gap-2">
            <input
              type="text"
              value={memberIdInput}
              onChange={e => { setMemberIdInput(e.target.value); setFoundProfile(null); setMemberNotFound(false); }}
              onKeyDown={e => { if (e.key === 'Enter') handleLookupUser(); }}
              placeholder="Enter 6-character code"
              style={{ fontSize: '16px' }}
              className="flex-1 h-[44px] px-4 border border-neutral-200 rounded-md bg-neutral-0 text-sm font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-neutral-400"
            />
            <Button size="md" variant="secondary" loading={lookingUp} onClick={handleLookupUser}>
              Find
            </Button>
          </div>

          {memberNotFound && (
            <p className="text-sm text-red-500 font-sans">User not found</p>
          )}

          {foundProfile && (
            <div className="flex items-center gap-3 px-4 py-3 bg-neutral-50 rounded-md">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-green-600 font-sans">
                  {foundProfile.display_name?.charAt(0).toUpperCase() ?? '?'}
                </span>
              </div>
              <p className="flex-1 text-sm font-semibold text-neutral-900 font-sans">{foundProfile.display_name}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" size="md" fullWidth onClick={closeAddMember}>Cancel</Button>
            <Button size="md" fullWidth disabled={!foundProfile} loading={addingMember} onClick={handleAddMember}>
              Add to Pantry
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
        <p className="text-sm font-semibold text-neutral-900 font-sans truncate">{item.name}</p>
        {(item.quantity || item.unit) && (
          <p className="text-xs text-neutral-400 font-sans mt-0.5">
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
        className="w-10 h-10 flex items-center justify-center rounded-md text-neutral-400 active:scale-95 active:text-danger-600 active:bg-danger-50 transition-all flex-shrink-0"
        aria-label={`Remove ${item.name} from pantry`}
      >
        <Trash size={20} weight="regular" />
      </button>
    </div>
  );
}
