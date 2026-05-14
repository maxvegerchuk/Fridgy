import { useState, useId } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash, Check, ArrowCounterClockwise, Plus, CaretLeft, Users } from 'phosphor-react';
import { EmptyState, Button, Skeleton, BottomSheet } from '../components/ui';
import AddItemSheet from '../components/list/AddItemSheet';
import { useShoppingList } from '../hooks/useShoppingList';
import { usePantry } from '../hooks/usePantry';
import { CATEGORIES } from '../types';
import type { ItemCategory, ListItem } from '../types';

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

  const { list, items, loading, addItem, checkItem, deleteItem, updateItem } = useShoppingList(id);
  const { refetch: refetchPantry } = usePantry();
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<ListItem | null>(null);

  const unchecked = items.filter(i => !i.is_checked);
  const checked = items.filter(i => i.is_checked);
  const groups = groupByCategory(unchecked);

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-neutral-100" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="flex items-center h-[56px] px-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="p-1 -ml-1 text-neutral-800 active:scale-95 transition-transform flex-shrink-0"
          aria-label="Back to lists"
        >
          <CaretLeft size={24} />
        </button>

        <h1 className="ml-3 flex-1 min-w-0 text-h3 font-heading text-neutral-900 truncate">
          {list?.name ?? 'Shopping List'}
        </h1>

        <button
          type="button"
          onClick={() => navigate(`/list/${id}/members`)}
          className="w-10 h-10 flex items-center justify-center rounded-md text-neutral-600 active:scale-95 active:bg-neutral-100 transition"
          aria-label="Members"
        >
          <Users size={22} weight="regular" />
        </button>
      </div>
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
                  <span className="text-badge font-semibold uppercase tracking-wide text-neutral-400 font-sans">
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
                      onEdit={setEditItem}
                    />
                  ))}
                </div>
              </div>
            ))}

            {checked.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-4 pt-5 pb-2">
                  <span className="text-badge font-semibold uppercase tracking-wide text-neutral-400 font-sans">
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
                      onEdit={setEditItem}
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

      <EditQuantitySheet
        item={editItem}
        onClose={() => setEditItem(null)}
        onSave={updateItem}
      />
    </div>
  );
}

type ItemRowProps = {
  item: ListItem;
  onCheck: (id: string, checked: boolean, onChecked?: () => void) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (item: ListItem) => void;
  onChecked?: () => void;
  dimmed?: boolean;
};

function ItemRow({ item, onCheck, onDelete, onEdit, onChecked, dimmed }: ItemRowProps) {
  return (
    <div
      className={[
        'flex items-center gap-3 px-4',
        dimmed ? 'opacity-50' : '',
      ].join(' ')}
    >
      <div className="w-16 h-16 rounded-md bg-neutral-50 flex-shrink-0" aria-hidden="true" />

      {/* Name + qty — tap to edit quantity */}
      <button
        type="button"
        onClick={() => onEdit(item)}
        className="flex-1 min-w-0 text-left active:opacity-70 transition-opacity"
      >
        <p
          className={[
            'text-body-sm font-semibold font-sans truncate',
            item.is_checked ? 'line-through text-neutral-400' : 'text-neutral-900',
          ].join(' ')}
        >
          {item.name}
        </p>
        <p className="text-badge font-sans mt-0.5 text-neutral-400">
          {(item.quantity || item.unit)
            ? [item.quantity, item.unit].filter(Boolean).join(' ')
            : 'Add quantity'}
        </p>
      </button>

      {/* Check / uncheck */}
      <button
        type="button"
        onClick={() => onCheck(item.id, !item.is_checked, item.is_checked ? undefined : onChecked)}
        className={[
          'w-10 h-10 flex items-center justify-center rounded-md transition active:scale-95 flex-shrink-0',
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
        className="w-10 h-10 flex items-center justify-center rounded-md text-neutral-400 active:scale-95 active:text-red-700 active:bg-red-50 transition flex-shrink-0"
        aria-label="Delete item"
      >
        <Trash size={20} weight="regular" />
      </button>
    </div>
  );
}

const UNITS = ['pcs', 'g', 'kg', 'ml', 'l'];

type EditQuantitySheetProps = {
  item: ListItem | null;
  onClose: () => void;
  onSave: (id: string, quantity: number | undefined, unit: string | undefined) => Promise<void>;
};

function EditQuantitySheet({ item, onClose, onSave }: EditQuantitySheetProps) {
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('pcs');
  const unitId = useId();

  // Sync fields when a new item is selected
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
