import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ShareNetwork, Trash, Check, Plus, ArrowLeft } from 'phosphor-react';
import { EmptyState, Button, Skeleton } from '../components/ui';
import AddItemSheet from '../components/list/AddItemSheet';
import ShareSheet from '../components/list/ShareSheet';
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

  const { list, items, loading, addItem, checkItem, deleteItem } = useShoppingList(id);
  const { refetch: refetchPantry } = usePantry();
  const [addOpen, setAddOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const unchecked = items.filter(i => !i.is_checked);
  const checked = items.filter(i => i.is_checked);
  const groups = groupByCategory(unchecked);

  return (
    <div className="flex flex-col h-full bg-neutral-0 pt-safe">
      {/* Header */}
      <div className="flex items-center justify-between h-[56px] px-4 border-b border-neutral-100 sticky top-0 bg-neutral-0 z-10 flex-shrink-0">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="p-1 -ml-1 text-neutral-700 active:scale-95 transition-transform"
          aria-label="Back to lists"
        >
          <ArrowLeft size={24} />
        </button>

        <h1 className="flex-1 text-base font-semibold text-neutral-900 font-display text-center mx-2 truncate">
          {list?.name ?? 'Shopping List'}
        </h1>

        <div className="flex items-center gap-1">
          {list?.invite_token && (
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="w-11 h-11 flex items-center justify-center rounded-lg text-neutral-500 active:scale-95 active:bg-neutral-100 transition-all"
              aria-label="Share list"
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
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex flex-col gap-3 px-4 py-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-[56px] rounded-lg" />
            ))}
          </div>
        )}

        {!loading && unchecked.length === 0 && checked.length === 0 && (
          <EmptyState
            icon={<ShoppingCart size={56} weight="light" />}
            title="Your list is empty"
            description="Tap Add to start building your shopping list"
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
                <div className="flex items-center gap-2 px-4 pt-4 pb-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 font-sans">
                    {CATEGORIES[cat].label}
                  </span>
                </div>
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
            ))}

            {checked.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-4 pt-5 pb-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 font-sans">
                    In Cart ({checked.length})
                  </span>
                </div>
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
            )}
          </div>
        )}
      </div>

      <AddItemSheet
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onAddItem={addItem}
        listId={id ?? null}
      />

      {list?.invite_token && (
        <ShareSheet
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          link={`https://fridgy-olive.vercel.app/list/join/${list.invite_token}`}
          title="Share List"
        />
      )}
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
        'flex items-center gap-3 px-4 h-[56px] border-b border-neutral-100 last:border-0',
        dimmed ? 'opacity-50' : '',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={() => onCheck(item.id, !item.is_checked, item.is_checked ? undefined : onChecked)}
        className={[
          'w-[26px] h-[26px] flex-shrink-0 rounded-full border-2 flex items-center justify-center active:scale-95 transition-all',
          item.is_checked
            ? 'bg-green-500 border-green-500'
            : 'bg-neutral-0 border-neutral-300',
        ].join(' ')}
        aria-label={item.is_checked ? 'Uncheck item' : 'Check item'}
      >
        {item.is_checked && <Check size={14} weight="bold" className="text-neutral-0" />}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={[
            'text-sm font-medium font-sans truncate',
            item.is_checked ? 'line-through text-neutral-400' : 'text-neutral-900',
          ].join(' ')}
        >
          {item.name}
        </p>
        {(item.quantity || item.unit) && (
          <p className="text-xs text-neutral-400 font-sans">
            {[item.quantity, item.unit].filter(Boolean).join(' ')}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDelete(item.id)}
        className="w-11 h-11 flex items-center justify-center text-neutral-400 active:scale-95 active:text-danger-600 transition-all flex-shrink-0"
        aria-label="Delete item"
      >
        <Trash size={18} weight="regular" />
      </button>
    </div>
  );
}
