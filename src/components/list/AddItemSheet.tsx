import { useState, useId, useRef } from 'react';
import { Microphone, X } from 'phosphor-react';
import { BottomSheet, SegmentControl, Button, ProductNameInput } from '../ui';
import { useToast } from '../ui';
import { usePurchaseHistory } from '../../hooks/usePurchaseHistory';
import { startVoiceRecognition, isSpeechRecognitionSupported } from '../../lib/voiceInput';
import { parseVoiceInput } from '../../lib/parseVoiceInput';
import { searchProducts } from '../../lib/productSuggestions';
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

const INPUT_CLS = 'w-full h-[44px] px-4 border border-neutral-200 rounded-lg bg-neutral-0 text-base font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-neutral-400';
const LABEL_CLS = 'text-sm font-medium text-neutral-700';

export default function AddItemSheet({ isOpen, onClose, onAddItem, listId }: Props) {
  const [tab, setTab] = useState<'new' | 'recent'>('new');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<string>('pcs');
  const [category, setCategory] = useState<ItemCategory>('other');
  const [submitting, setSubmitting] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported] = useState(isSpeechRecognitionSupported);

  const unitId = useId();
  const quantityRef = useRef<HTMLInputElement>(null);
  const stopVoiceRef = useRef<(() => void) | null>(null);

  const toast = useToast();
  const { history, loading: historyLoading, addToList } = usePurchaseHistory(listId);

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

  const stopVoice = () => {
    stopVoiceRef.current?.();
    stopVoiceRef.current = null;
    setListening(false);
  };

  const handleVoiceStart = () => {
    const stop = startVoiceRecognition(
      (text) => {
        stopVoiceRef.current = null;
        setListening(false);

        const parsed = parseVoiceInput(text);
        setName(parsed.name);
        if (parsed.quantity !== null) setQuantity(String(parsed.quantity));

        const suggestions = searchProducts(parsed.name);
        if (suggestions.length > 0) {
          const best = suggestions[0];
          setCategory(best.category);
          setUnit(parsed.unit ?? best.defaultUnit);
        } else if (parsed.unit !== null) {
          setUnit(parsed.unit);
        }

        focusQuantity();
      },
      () => {
        stopVoiceRef.current = null;
        setListening(false);
        toast('Could not hear you, try again', 'error');
      },
    );
    setListening(true);
    stopVoiceRef.current = stop;
  };

  const reset = () => {
    stopVoice();
    setName('');
    setQuantity('');
    setUnit('pcs');
    setCategory('other');
    setSubmitting(false);
    setTab('new');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleTabChange = (v: string) => {
    if (listening) stopVoice();
    setTab(v as 'new' | 'recent');
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
        onChange={handleTabChange}
        className="mb-4"
      />

      {tab === 'new' && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name field + mic button */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className={LABEL_CLS}>Item name</span>
              {voiceSupported && (
                <button
                  type="button"
                  onClick={listening ? stopVoice : handleVoiceStart}
                  className={[
                    'flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium font-sans',
                    'active:scale-95 transition-all',
                    listening
                      ? 'bg-green-500 text-white'
                      : 'bg-neutral-100 text-neutral-500 active:bg-neutral-200',
                  ].join(' ')}
                  aria-label={listening ? 'Stop recording' : 'Voice input'}
                >
                  {listening
                    ? <><X size={13} weight="bold" className="animate-pulse" /> Stop</>
                    : <><Microphone size={13} /> Voice</>
                  }
                </button>
              )}
            </div>
            <ProductNameInput
              value={name}
              onChange={setName}
              onSelect={handleSuggestion}
              onCommit={focusQuantity}
              label=""
              placeholder="e.g. Milk"
              required
            />
          </div>

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
              <div className="min-w-0 text-left">
                <p className="text-sm font-medium text-neutral-900 truncate">{item.name}</p>
                {(item.quantity || item.unit) && (
                  <p className="text-xs text-neutral-400">
                    {[item.quantity, item.unit].filter(Boolean).join(' ')}
                  </p>
                )}
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
