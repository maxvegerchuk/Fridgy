import { useId } from 'react';
import { CATEGORIES } from '../../types';
import { searchProducts } from '../../lib/productSuggestions';
import type { ProductSuggestion } from '../../lib/productSuggestions';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: ProductSuggestion) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
};

export default function ProductNameInput({
  value,
  onChange,
  onSelect,
  label = 'Item name',
  placeholder = 'e.g. Milk',
  required,
}: Props) {
  const id = useId();
  const suggestions = searchProducts(value);
  const showSuggestions = value.trim().length > 0 && suggestions.length > 0;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-neutral-700">{label}</label>
      )}
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        required={required}
        className="w-full h-[44px] px-4 border border-neutral-200 rounded-lg bg-neutral-0 text-base font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-neutral-400"
      />

      {showSuggestions && (
        <ul className="flex flex-col border border-neutral-200 rounded-lg overflow-hidden bg-neutral-0 shadow-sm">
          {suggestions.map((s) => (
            <li key={s.name}>
              <button
                type="button"
                onMouseDown={(e) => {
                  // mousedown fires before blur — prevent input losing focus first
                  e.preventDefault();
                  onSelect(s);
                }}
                className="w-full flex items-center gap-3 h-[44px] px-3 text-left active:bg-neutral-100 border-b border-neutral-100 last:border-0 transition-colors"
              >
                <span className="text-base leading-none flex-shrink-0">
                  {CATEGORIES[s.category].emoji}
                </span>
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
