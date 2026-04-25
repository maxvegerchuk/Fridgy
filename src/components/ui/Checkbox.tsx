import { useId } from 'react';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
};

export default function Checkbox({ checked, onChange, label, className }: Props) {
  const id = useId();

  return (
    <label
      htmlFor={id}
      className={['flex items-center gap-3 min-h-[44px] active:scale-95 transition-transform cursor-pointer select-none', className].filter(Boolean).join(' ')}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <div
        className={[
          'w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors',
          checked ? 'bg-green-500 border-green-500' : 'bg-neutral-0 border-neutral-300',
        ].join(' ')}
      >
        {checked && (
          <svg width="12" height="9" viewBox="0 0 12 9" fill="none" aria-hidden="true">
            <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      {label && <span className="text-neutral-900 text-base">{label}</span>}
    </label>
  );
}
