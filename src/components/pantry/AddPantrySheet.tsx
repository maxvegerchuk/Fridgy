import { useState, useId } from 'react';
import { BottomSheet, Input, Button } from '../ui';
import { CATEGORIES } from '../../types';
import type { ItemCategory } from '../../types';
import type { NewPantryItem } from '../../hooks/usePantry';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: NewPantryItem) => Promise<void>;
};

const UNITS = ['pcs', 'g', 'kg', 'ml', 'l'] as const;
const CATEGORY_KEYS = Object.keys(CATEGORIES) as ItemCategory[];

export default function AddPantrySheet({ isOpen, onClose, onAddItem }: Props) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<string>('pcs');
  const [category, setCategory] = useState<ItemCategory>('other');
  const [submitting, setSubmitting] = useState(false);
  const unitId = useId();

  const reset = () => {
    setName('');
    setQuantity('');
    setUnit('pcs');
    setCategory('other');
    setSubmitting(false);
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

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="Add to Pantry">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Item name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Olive Oil"
          autoComplete="off"
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

        <Button type="submit" size="lg" fullWidth loading={submitting} className="mt-1">
          Add to Pantry
        </Button>
      </form>
    </BottomSheet>
  );
}
