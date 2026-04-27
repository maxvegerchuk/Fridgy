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
    <div className="flex flex-col h-full pt-safe">
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

        <div className="flex items-center gap-1 flex-shrink-0">
          {list?.invite_token && (
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-md text-neutral-500 active:scale-95 active:bg-neutral-100 transition-all"
              aria-label="Share list"
            >
              <ShareNetwork size={22} weight="regular" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-md text-neutral-500 active:scale-95 active:bg-neutral-100 transition-all"
            aria-label="Add item"
          >
            <Plus size={22} weight="bold" />
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
          item.is_checked ? 'text-green-500' : 'text-neutral-400 active:text-green-500 active:bg-green-50',
        ].join(' ')}
        aria-label={item.is_checked ? 'Uncheck item' : 'Check item'}
      >
        <Check size={20} weight={item.is_checked ? 'bold' : 'regular'} />
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
