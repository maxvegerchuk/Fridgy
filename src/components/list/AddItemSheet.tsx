import { useState, useId } from 'react';
import { BottomSheet, SegmentControl, Input, Button, ProductNameInput } from '../ui';
import { usePurchaseHistory } from '../../hooks/usePurchaseHistory';
import { CATEGORIES } from '../../types';
import type { ItemCategory } from '../../types';
import type { NewListItem } from '../../hooks/useShoppingList';
import type { PurchaseHistoryItem } from '../../types';
import type { ProductSuggestion } from '../../lib/productSuggestions';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: NewListItem) => Promise<void>;
  listId: string | null;
};

const UNITS = ['pcs', 'g', 'kg', 'ml', 'l'] as const;
const CATEGORY_KEYS = Object.keys(CATEGORIES) as ItemCategory[];

export default function AddItemSheet({ isOpen, onClose, onAddItem, listId }: Props) {
  const [tab, setTab] = useState<'new' | 'recent'>('new');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<string>('pcs');
  const [category, setCategory] = useState<ItemCategory>('other');
  const [submitting, setSubmitting] = useState(false);
  const unitId = useId();

  const { history, loading: historyLoading, addToList } = usePurchaseHistory(listId);

  const reset = () => {
    setName('');
    setQuantity('');
    setUnit('pcs');
    setCategory('other');
    setSubmitting(false);
    setTab('new');
  };

  const handleSuggestion = (s: ProductSuggestion) => {
    setName(s.name);
    setCategory(s.category);
    setUnit(s.defaultUnit);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    await onAddItem({
      name: name.trim(),
      quantity: quantity ? Number(quantity) : undefined,
      unit: unit !== 'pcs' ? unit : undefined,
      category,
    });
    reset();
    onClose();
  };

  const handleRecentTap = async (item: PurchaseHistoryItem) => {
    await addToList(item);
    handleClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="Add Item">
      <SegmentControl
        options={[
          { value: 'new', label: 'New Item' },
          { value: 'recent', label: 'Recent' },
        ]}
        value={tab}
        onChange={(v) => setTab(v as 'new' | 'recent')}
        className="mb-4"
      />

      {tab === 'new' && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <ProductNameInput
            value={name}
            onChange={setName}
            onSelect={handleSuggestion}
            placeholder="e.g. Milk"
            required
          />

          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                label="Qty"
                type="number"
                min="0"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="—"
              />
            </div>
            <div className="flex flex-col gap-1.5 w-24">
              <label htmlFor={unitId} className="text-sm font-medium text-neutral-700">Unit</label>
              <select
                id={unitId}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="h-[44px] w-full px-3 border border-neutral-200 rounded-lg bg-neutral-0 text-base font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {UNITS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-neutral-700">Category</span>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORY_KEYS.map(key => {
                const cat = CATEGORIES[key];
                const active = category === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className={[
                      'flex flex-col items-center justify-center gap-1 h-[64px] rounded-lg border text-xs font-medium active:scale-95 transition-all',
                      active
                        ? 'border-green-500 bg-green-50 text-green-600'
                        : 'border-neutral-200 bg-neutral-0 text-neutral-600',
                    ].join(' ')}
                  >
                    <span className="text-xl leading-none">{cat.emoji}</span>
                    <span className="leading-tight text-center">{cat.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={submitting}
            className="mt-1"
          >
            Add to List
          </Button>
        </form>
      )}

      {tab === 'recent' && (
        <div className="flex flex-col">
          {historyLoading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!historyLoading && history.length === 0 && (
            <p className="text-center text-neutral-400 text-sm py-8 font-sans">
              No purchase history yet
            </p>
          )}
          {!historyLoading && history.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleRecentTap(item)}
              className="flex items-center justify-between h-[56px] px-1 border-b border-neutral-100 last:border-0 active:scale-95 active:bg-neutral-50 transition-all rounded-md"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg flex-shrink-0">{CATEGORIES[item.category].emoji}</span>
                <div className="min-w-0 text-left">
                  <p className="text-sm font-medium text-neutral-900 truncate">{item.name}</p>
                  {(item.quantity || item.unit) && (
                    <p className="text-xs text-neutral-400">
                      {[item.quantity, item.unit].filter(Boolean).join(' ')}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-xs text-neutral-400 flex-shrink-0 ml-3">
                ×{item.purchase_count}
              </span>
            </button>
          ))}
        </div>
      )}
    </BottomSheet>
  );
}
