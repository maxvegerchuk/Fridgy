import { useState } from 'react';
import { ShoppingBagOpen, ShareNetwork, Trash, ShoppingCart, Plus } from 'phosphor-react';
import { EmptyState, Button, Skeleton } from '../components/ui';
import { useToast } from '../components/ui';
import AddPantrySheet from '../components/pantry/AddPantrySheet';
import AddToListSheet from '../components/pantry/AddToListSheet';
import ShareSheet from '../components/list/ShareSheet';
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

export default function PantryPage() {
  const { pantry, items, loading, addItem, deleteItem, addToShoppingList } = usePantry();
  const [addOpen, setAddOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [addToListItem, setAddToListItem] = useState<PantryItem | null>(null);
  const toast = useToast();

  const groups = groupByCategory(items);

  return (
    <div className="flex flex-col h-full pt-safe">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 flex-shrink-0">
        <h1 className="text-xl font-semibold text-neutral-900 font-sans">Pantry</h1>
        <div className="flex items-center gap-2">
          {pantry?.invite_token && (
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="w-11 h-11 flex items-center justify-center rounded-lg text-neutral-500 active:scale-95 active:bg-neutral-100 transition-all"
              aria-label="Share pantry"
            >
              <ShareNetwork size={22} weight="regular" />
            </button>
          )}
          <Button size="sm" variant="primary" onClick={() => setAddOpen(true)}>
            <Plus size={16} weight="bold" className="mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="scroll-area">
        {loading && (
          <div className="flex flex-col gap-3 px-4 py-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-[56px] rounded-lg" />
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
            {groups.map(([cat, catItems]) => (
              <div key={cat}>
                <div className="flex items-center gap-2 px-4 pt-4 pb-1">
                  <span className="text-base leading-none">{CATEGORIES[cat].emoji}</span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 font-sans">
                    {CATEGORIES[cat].label}
                  </span>
                </div>
                {catItems.map(item => (
                  <PantryItemRow
                    key={item.id}
                    item={item}
                    onAddToList={() => setAddToListItem(item)}
                    onDelete={deleteItem}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

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

      {pantry?.invite_token && (
        <ShareSheet
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          link={`https://fridgy-olive.vercel.app/pantry/join/${pantry.invite_token}`}
          title="Share Pantry"
        />
      )}
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
    <div className="flex items-center gap-3 px-4 min-h-[56px] py-2 border-b border-neutral-100 last:border-0">
      {/* Name + qty */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 font-sans truncate">{item.name}</p>
        {(item.quantity || item.unit) && (
          <p className="text-xs text-neutral-400 font-sans">
            {[item.quantity, item.unit].filter(Boolean).join(' ')}
          </p>
        )}
      </div>

      {/* Add to list — opens sheet to confirm qty/unit */}
      <button
        type="button"
        onClick={onAddToList}
        className="flex items-center gap-1 h-[36px] px-3 rounded-md border border-green-500 text-green-600 text-xs font-semibold font-sans active:scale-95 active:bg-green-50 transition-all flex-shrink-0"
        aria-label={`Add ${item.name} to shopping list`}
      >
        <ShoppingCart size={14} weight="bold" />
        List
      </button>

      {/* Delete */}
      <button
        type="button"
        onClick={() => onDelete(item.id)}
        className="w-11 h-11 flex items-center justify-center text-neutral-400 active:scale-95 active:text-danger-600 transition-all flex-shrink-0"
        aria-label={`Delete ${item.name}`}
      >
        <Trash size={18} weight="regular" />
      </button>
    </div>
  );
}
