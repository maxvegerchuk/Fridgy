import { useState, useId, useRef } from 'react';
import { BottomSheet, Button, ProductNameInput } from '../ui';
import type { ItemCategory } from '../../types';
import type { NewPantryItem } from '../../hooks/usePantry';
import type { ProductSuggestion } from '../../lib/productSuggestions';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: NewPantryItem) => Promise<void>;
};

const UNITS = ['pcs', 'g', 'kg', 'ml', 'l'] as const;

const INPUT_CLS = 'w-full h-[44px] px-4 border border-neutral-200 rounded-lg bg-neutral-0 text-base font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-neutral-400';
const LABEL_CLS = 'text-sm font-medium text-neutral-700';

export default function AddPantrySheet({ isOpen, onClose, onAddItem }: Props) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<string>('pcs');
  const [category, setCategory] = useState<ItemCategory>('other');
  const [submitting, setSubmitting] = useState(false);
  const unitId = useId();
  const quantityRef = useRef<HTMLInputElement>(null);

  const focusQuantity = () => {
    requestAnimationFrame(() => {
      quantityRef.current?.focus();
      quantityRef.current?.select();
    });
  };

  const handleSuggestion = (s: ProductSuggestion) => {
    setName(s.name);
    setCategory(s.category);
    setUnit(s.defaultUnit);
    focusQuantity();
  };

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
        <ProductNameInput
          value={name}
          onChange={setName}
          onSelect={handleSuggestion}
          onCommit={focusQuantity}
          placeholder="e.g. Olive Oil"
          required
        />

        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className={LABEL_CLS}>Qty</label>
            <input
              ref={quantityRef}
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              onFocus={(e) => e.target.select()}
              className={INPUT_CLS}
            />
          </div>
          <div className="flex flex-col gap-1.5 w-24">
            <label htmlFor={unitId} className={LABEL_CLS}>Unit</label>
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

        <Button type="submit" size="lg" fullWidth loading={submitting} className="mt-1">
          Add to Pantry
        </Button>
      </form>
    </BottomSheet>
  );
}
