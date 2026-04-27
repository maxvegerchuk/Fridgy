import { useState, useId, useEffect } from 'react';
import { BottomSheet, Input, Button } from '../ui';
import type { PantryItem } from '../../types';

type Props = {
  item: PantryItem | null;   // null = closed
  onClose: () => void;
  onConfirm: (item: PantryItem, quantity: number | undefined, unit: string | undefined) => Promise<void>;
};

const UNITS = ['pcs', 'g', 'kg', 'ml', 'l'] as const;

export default function AddToListSheet({ item, onClose, onConfirm }: Props) {
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [submitting, setSubmitting] = useState(false);
  const unitId = useId();

  // Pre-fill when a new item is selected
  useEffect(() => {
    if (item) {
      setQuantity(item.quantity != null ? String(item.quantity) : '');
      setUnit(item.unit ?? 'pcs');
    }
  }, [item?.id]);

  const handleClose = () => {
    setSubmitting(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setSubmitting(true);
    await onConfirm(
      item,
      quantity ? Number(quantity) : undefined,
      unit !== 'pcs' ? unit : undefined,
    );
    setSubmitting(false);
    onClose();
  };

  return (
    <BottomSheet isOpen={item !== null} onClose={handleClose} title="Add to Shopping List">
      {item && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name — readonly */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-neutral-700">Item</span>
            <div className="h-[44px] px-4 flex items-center bg-neutral-100 rounded-md">
              <span className="text-base text-neutral-500 font-sans truncate">{item.name}</span>
            </div>
          </div>

          {/* Quantity + unit */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                label="Quantity"
                type="number"
                min="0"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="—"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5 w-24">
              <label htmlFor={unitId} className="text-sm font-medium text-neutral-700">Unit</label>
              <select
                id={unitId}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="h-[44px] w-full px-3 border border-neutral-200 rounded-md bg-neutral-0 text-base font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {UNITS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-1">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              fullWidth
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={submitting}
            >
              Add to List
            </Button>
          </div>
        </form>
      )}
    </BottomSheet>
  );
}
