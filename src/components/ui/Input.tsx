import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export default function Input({ label, error, className, ...props }: Props) {
  const id = useId();

  const inputCls = [
    'h-[44px] w-full px-3 rounded-lg border font-sans text-base bg-neutral-0',
    'focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent',
    'placeholder:text-neutral-400 text-neutral-900',
    error ? 'border-danger-600' : 'border-neutral-200',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <input id={id} className={inputCls} {...props} />
      {error && <p className="text-xs text-danger-600">{error}</p>}
    </div>
  );
}
