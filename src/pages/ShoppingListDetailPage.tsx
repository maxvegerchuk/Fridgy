import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash, Check, ArrowCounterClockwise, Plus, ArrowLeft, UserPlus } from 'phosphor-react';
import { EmptyState, Button, Skeleton, BottomSheet } from '../components/ui';
import { useToast } from '../components/ui';
import AddItemSheet from '../components/list/AddItemSheet';
import { useShoppingList } from '../hooks/useShoppingList';
import { usePantry } from '../hooks/usePantry';
import { supabase } from '../lib/supabase';
import { randomUUID } from '../lib/uuid';
import { CATEGORIES } from '../types';
import type { ItemCategory, ListItem, Profile } from '../types';

const CATEGORY_ORDER: ItemCategory[] = [
  'vegetables', 'fruits', 'dairy', 'meat', 'fish',
  'bakery', 'frozen', 'canned', 'drinks', 'snacks', 'household', 'other',
];

function groupByCategory(items: ListItem[]): [ItemCategory, ListItem[]][] {
  const map = new Map<ItemCategory, ListItem[]>();
  for (const item of items) {
    const bucket = map.get(item.category) ?? [];
    bucket.push(item);
    map.set(item.category, bucket);
  }
  return CATEGORY_ORDER
    .filter(cat => map.has(cat))
    .map(cat => [cat, map.get(cat)!]);
}

export default function ShoppingListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { list, items, loading, addItem, checkItem, deleteItem } = useShoppingList(id);
  const { refetch: refetchPantry } = usePantry();
  const [addOpen, setAddOpen] = useState(false);

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [memberIdInput, setMemberIdInput] = useState('');
  const [foundProfile, setFoundProfile] = useState<Profile | null>(null);
  const [memberNotFound, setMemberNotFound] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const toast = useToast();

  const handleLookupUser = async () => {
    const uid = memberIdInput.trim();
    if (!uid) return;
    setLookingUp(true);
    setFoundProfile(null);
    setMemberNotFound(false);
    const { data } = await supabase.rpc('find_user_by_id', { p_user_id: uid });
    setLookingUp(false);
    if (data) setFoundProfile(data as Profile);
    else setMemberNotFound(true);
  };

  const handleAddMember = async () => {
    if (!foundProfile || !list) return;
    setAddingMember(true);
    const { error } = await supabase.from('list_members').insert({
      id: randomUUID(),
      list_id: list.id,
      user_id: foundProfile.id,
      role: 'editor',
    });
    setAddingMember(false);
    if (error) {
      toast(error.message, 'error');
    } else {
      toast(`${foundProfile.display_name} added to list`, 'success');
      closeAddMember();
    }
  };

  const closeAddMember = () => {
    setAddMemberOpen(false);
    setMemberIdInput('');
    setFoundProfile(null);
    setMemberNotFound(false);
  };

  const unchecked = items.filter(i => !i.is_checked);
  const checked = items.filter(i => i.is_checked);
  const groups = groupByCategory(unchecked);

  return (
    <div className="flex flex-col h-full pt-safe relative">
      {/* Header */}
      <div className="flex items-center h-[56px] px-4 border-b border-neutral-100 flex-shrink-0 bg-white">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-neutral-700 active:scale-95 transition-transform flex-shrink-0"
          aria-label="Back to lists"
        >
          <ArrowLeft size={24} />
        </button>

        <h1 className="ml-6 flex-1 min-w-0 text-base font-semibold text-neutral-900 font-display truncate">
          {list?.name ?? 'Shopping List'}
        </h1>

        <button
          type="button"
          onClick={() => setAddMemberOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-md text-neutral-500 active:scale-95 active:bg-neutral-100 transition-all"
          aria-label="Add member"
        >
          <UserPlus size={22} weight="regular" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex flex-col gap-3 px-4 py-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-[88px] rounded-md" />
            ))}
          </div>
        )}

        {!loading && unchecked.length === 0 && checked.length === 0 && (
          <EmptyState
            icon={<ShoppingCart size={56} weight="light" />}
            title="Your list is empty"
            description="Tap + to start building your shopping list"
            action={
              <Button size="md" onClick={() => setAddOpen(true)}>
                Add First Item
              </Button>
            }
          />
        )}

        {!loading && (unchecked.length > 0 || checked.length > 0) && (
          <div className="pb-4">
            {groups.map(([cat, catItems]) => (
              <div key={cat}>
                <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 font-sans">
                    {CATEGORIES[cat].label}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {catItems.map(item => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onCheck={checkItem}
                      onDelete={deleteItem}
                      onChecked={refetchPantry}
                    />
                  ))}
                </div>
              </div>
            ))}

            {checked.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-4 pt-5 pb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 font-sans">
                    In Cart ({checked.length})
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {checked.map(item => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onCheck={checkItem}
                      onDelete={deleteItem}
                      dimmed
                    />
                  ))}
                </div>
              </div>
            )}
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

      <AddItemSheet
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onAddItem={addItem}
        listId={id ?? null}
      />

      {/* Add member sheet */}
      <BottomSheet isOpen={addMemberOpen} onClose={closeAddMember} title="Add Member">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={memberIdInput}
              onChange={e => { setMemberIdInput(e.target.value); setFoundProfile(null); setMemberNotFound(false); }}
              onKeyDown={e => { if (e.key === 'Enter') handleLookupUser(); }}
              placeholder="Paste user ID"
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
              Add to List
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

type ItemRowProps = {
  item: ListItem;
  onCheck: (id: string, checked: boolean, onChecked?: () => void) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onChecked?: () => void;
  dimmed?: boolean;
};

function ItemRow({ item, onCheck, onDelete, onChecked, dimmed }: ItemRowProps) {
  return (
    <div
      className={[
        'flex items-center gap-3 px-4',
        dimmed ? 'opacity-50' : '',
      ].join(' ')}
    >
      {/* Image placeholder */}
      <div className="w-16 h-16 rounded-md bg-white border border-neutral-100 flex-shrink-0" />

      {/* Name + qty */}
      <div className="flex-1 min-w-0">
        <p
          className={[
            'text-sm font-semibold font-sans truncate',
            item.is_checked ? 'line-through text-neutral-400' : 'text-neutral-900',
          ].join(' ')}
        >
          {item.name}
        </p>
        {(item.quantity || item.unit) && (
          <p className="text-xs text-neutral-400 font-sans mt-0.5">
            {[item.quantity, item.unit].filter(Boolean).join(' ')}
          </p>
        )}
      </div>

      {/* Check / uncheck */}
      <button
        type="button"
        onClick={() => onCheck(item.id, !item.is_checked, item.is_checked ? undefined : onChecked)}
        className={[
          'w-10 h-10 flex items-center justify-center rounded-md transition-all active:scale-95 flex-shrink-0',
          item.is_checked
            ? 'text-neutral-400 active:text-neutral-600 active:bg-neutral-100'
            : 'text-neutral-400 active:text-green-500 active:bg-green-50',
        ].join(' ')}
        aria-label={item.is_checked ? 'Return to list' : 'Mark as in cart'}
      >
        {item.is_checked
          ? <ArrowCounterClockwise size={20} weight="regular" />
          : <Check size={20} weight="regular" />
        }
      </button>

      {/* Delete */}
      <button
        type="button"
        onClick={() => onDelete(item.id)}
        className="w-10 h-10 flex items-center justify-center rounded-md text-neutral-400 active:scale-95 active:text-danger-600 active:bg-danger-50 transition-all flex-shrink-0"
        aria-label="Delete item"
      >
        <Trash size={20} weight="regular" />
      </button>
    </div>
  );
}
