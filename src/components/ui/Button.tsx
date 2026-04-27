import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'xl';

const variantClasses: Record<Variant, string> = {
  primary:   'bg-green-500 text-white shadow-sm active:bg-green-600 active:shadow-none disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none',
  secondary: 'bg-neutral-0 text-neutral-900 border border-neutral-200 active:bg-neutral-100',
  ghost:     'text-neutral-700 active:bg-neutral-100',
  danger:    'bg-danger-600 text-white active:bg-red-700',
};

const sizeClasses: Record<Size, string> = {
  sm:  'h-[36px] px-4 text-sm rounded-full',
  md:  'h-[44px] px-5 text-base rounded-full',
  lg:  'h-[52px] px-6 text-base rounded-full',
  xl:  'h-12 px-6 text-base rounded-full',
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
};

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  children,
  className,
  ...props
}: Props) {
  const cls = [
    'inline-flex items-center justify-center font-medium font-sans',
    'active:scale-95 transition-all',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button disabled={disabled || loading} className={cls} {...props}>
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : children}
    </button>
  );
}
