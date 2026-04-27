import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';

type InputSize = 'md' | 'lg';

const sizeCls: Record<InputSize, string> = {
  md: 'h-[44px] rounded-xl',
  lg: 'h-12 rounded-xl',
};

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  inputSize?: InputSize;
};

export default function Input({ label, error, className, inputSize = 'md', ...props }: Props) {
  const id = useId();

  const inputCls = [
    'w-full px-4 border font-sans text-base bg-neutral-0',
    'focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500/50',
    'placeholder:text-neutral-300 text-neutral-900',
    'transition-shadow duration-150',
    sizeCls[inputSize],
    error ? 'border-danger-600' : 'border-neutral-200',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-neutral-600 font-sans">
          {label}
        </label>
      )}
      <input id={id} className={inputCls} {...props} />
      {error && <p className="text-xs text-danger-600">{error}</p>}
    </div>
  );
}
