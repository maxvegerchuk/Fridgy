import type { ReactNode } from 'react';

type Variant = 'green' | 'warning' | 'danger' | 'neutral';

const variantClasses: Record<Variant, string> = {
  green:   'bg-green-100 text-green-700',
  warning: 'bg-yellow-50 text-yellow-700',
  danger:  'bg-red-50 text-red-700',
  neutral: 'bg-neutral-100 text-neutral-600',
};

type Props = {
  variant?: Variant;
  children: ReactNode;
  className?: string;
};

export default function Badge({ variant = 'neutral', children, className }: Props) {
  const cls = [
    'inline-flex items-center h-5 px-[10px] rounded-full text-badge font-medium font-sans',
    variantClasses[variant],
    className,
  ].filter(Boolean).join(' ');

  return <span className={cls}>{children}</span>;
}
