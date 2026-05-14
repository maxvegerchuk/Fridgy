import { useState, useMemo, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBagOpen, ShoppingCart, Plus, Trash, MagnifyingGlass, Users } from 'phosphor-react';
import { EmptyState, Button, Skeleton, BottomSheet } from '../components/ui';
import { useToast } from '../components/ui';
import AddPantrySheet from '../components/pantry/AddPantrySheet';
import AddToListSheet from '../components/pantry/AddToListSheet';
import { usePantry } from '../hooks/usePantry';
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
  const navigate = useNavigate();
  const { items, loading, addItem, deleteItem, updateItem, addToShoppingList } = usePantry();
  const [addOpen, setAddOpen] = useState(false);
  const [addToListItem, setAddToListItem] = useState<PantryItem | null>(null);
  const [editItem, setEditItem] = useState<PantryItem | null>(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<ViewMode>('all');
  const toast = useToast();

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(item => item.name.toLowerCase().includes(q));
  }, [items, search]);

  const groups = groupByCategory(filteredItems);

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-neutral-100" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center h-[80px] px-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-h2 font-heading text-neutral-900">Pantry</h1>
            <p className="text-body text-neutral-600 font-sans">Your home ingredients</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/pantry/members')}
            className="w-10 h-10 flex items-center justify-center rounded-md text-neutral-600 active:scale-95 active:bg-neutral-100 transition"
            aria-label="Pantry members"
          >
            <Users size={22} weight="regular" />
          </button>
        </div>
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
              className={`h-[36px] px-4 rounded-full text-body-sm font-medium font-sans transition active:scale-95 whitespace-nowrap ${
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
                    onEdit={setEditItem}
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
                      onEdit={setEditItem}
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

      <EditQuantitySheet
        item={editItem}
        onClose={() => setEditItem(null)}
        onSave={updateItem}
      />
    </div>
  );
}

type ItemRowProps = {
  item: PantryItem;
  onAddToList: () => void;
  onDelete: (id: string) => Promise<void>;
  onEdit: (item: PantryItem) => void;
};

function PantryItemRow({ item, onAddToList, onDelete, onEdit }: ItemRowProps) {
  return (
    <div className="flex items-center gap-3 px-4">
      {/* Image placeholder */}
      <div className="w-16 h-16 rounded-md bg-white border border-neutral-100 flex-shrink-0" />

      {/* Name + qty — tap to edit quantity */}
      <button
        type="button"
        onClick={() => onEdit(item)}
        className="flex-1 min-w-0 text-left active:opacity-70 transition-opacity"
      >
        <p className="text-body-sm font-semibold text-neutral-900 font-sans truncate">{item.name}</p>
        <p className="text-badge text-neutral-400 font-sans mt-0.5">
          {(item.quantity || item.unit)
            ? [item.quantity, item.unit].filter(Boolean).join(' ')
            : 'Add quantity'}
        </p>
      </button>

      {/* Add to shopping list */}
      <button
        type="button"
        onClick={onAddToList}
        className="w-10 h-10 flex items-center justify-center rounded-md text-neutral-400 active:scale-95 active:bg-neutral-100 transition flex-shrink-0"
        aria-label={`Add ${item.name} to shopping list`}
      >
        <ShoppingCart size={20} weight="regular" />
      </button>

      {/* Delete from pantry */}
      <button
        type="button"
        onClick={() => onDelete(item.id)}
        className="w-10 h-10 flex items-center justify-center rounded-md text-neutral-400 active:scale-95 active:text-red-700 active:bg-red-50 transition flex-shrink-0"
        aria-label={`Remove ${item.name} from pantry`}
      >
        <Trash size={20} weight="regular" />
      </button>
    </div>
  );
}

const UNITS = ['pcs', 'g', 'kg', 'ml', 'l'];

type EditQuantitySheetProps = {
  item: PantryItem | null;
  onClose: () => void;
  onSave: (id: string, quantity: number | undefined, unit: string | undefined) => Promise<void>;
};

function EditQuantitySheet({ item, onClose, onSave }: EditQuantitySheetProps) {
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('pcs');
  const unitId = useId();

  const [prevItemId, setPrevItemId] = useState<string | null>(null);
  if (item && item.id !== prevItemId) {
    setPrevItemId(item.id);
    setQuantity(item.quantity != null ? String(item.quantity) : '');
    setUnit(item.unit ?? 'pcs');
  }

  const handleSave = async () => {
    if (!item) return;
    await onSave(
      item.id,
      quantity ? Number(quantity) : undefined,
      unit !== 'pcs' || !quantity ? (unit === 'pcs' && !quantity ? undefined : unit) : unit,
    );
    onClose();
  };

  return (
    <BottomSheet isOpen={!!item} onClose={onClose} title={item?.name ?? ''}>
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-caption font-medium text-neutral-800 font-sans">Qty</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              onFocus={(e) => e.target.select()}
              style={{ fontSize: '16px' }}
              className="w-full h-[44px] px-4 border border-neutral-200 rounded-md bg-neutral-0 text-body font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-neutral-400"
            />
          </div>
          <div className="flex flex-col gap-1.5 w-24">
            <label htmlFor={unitId} className="text-caption font-medium text-neutral-800 font-sans">Unit</label>
            <select
              id={unitId}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="h-[44px] w-full px-3 border border-neutral-200 rounded-md bg-neutral-0 text-body font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <Button size="lg" fullWidth onClick={handleSave}>Save</Button>
      </div>
    </BottomSheet>
  );
}
