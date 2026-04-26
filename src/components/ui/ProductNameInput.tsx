import { useId, useState } from 'react';
import { searchProducts } from '../../lib/productSuggestions';
import type { ProductSuggestion } from '../../lib/productSuggestions';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: ProductSuggestion) => void;
  /** Called when the user presses Enter/Done — move focus to next field */
  onCommit?: () => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
};

export default function ProductNameInput({
  value,
  onChange,
  onSelect,
  onCommit,
  label = 'Item name',
  placeholder = 'e.g. Milk',
  required,
}: Props) {
  const id = useId();
  const [dismissed, setDismissed] = useState(() => value.trim().length > 0);
  const suggestions = searchProducts(value);
  const showSuggestions = !dismissed && value.trim().length > 0 && suggestions.length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDismissed(false); // re-show suggestions when user keeps typing
    onChange(e.target.value);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-neutral-700">{label}</label>
      )}
      <input
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        autoComplete="off"
        required={required}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault(); // don't submit form yet — move to quantity
            setDismissed(true);
            onCommit?.();
          }
        }}
        className="w-full h-[44px] px-4 border border-neutral-200 rounded-lg bg-neutral-0 text-base font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-neutral-400"
      />

      {showSuggestions && (
        <ul className="flex flex-col border border-neutral-200 rounded-lg overflow-hidden bg-neutral-0 shadow-sm">
          {suggestions.map((s) => (
            <li key={s.name}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // fire before blur so input doesn't lose focus first
                  setDismissed(true);
                  onSelect(s);
                }}
                className="w-full flex items-center gap-3 h-[44px] px-3 text-left active:bg-neutral-100 border-b border-neutral-100 last:border-0 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-neutral-900 font-sans">{s.name}</span>
                </div>
                <span className="text-xs text-neutral-400 font-sans flex-shrink-0">
                  {s.defaultUnit}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
