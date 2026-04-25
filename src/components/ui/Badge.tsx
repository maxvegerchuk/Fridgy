import type { ReactNode } from 'react';

type Variant = 'green' | 'warning' | 'danger' | 'neutral';

const variantClasses: Record<Variant, string> = {
  green:   'bg-green-100 text-green-600',
  warning: 'bg-warning-50 text-warning-600',
  danger:  'bg-danger-50 text-danger-600',
  neutral: 'bg-neutral-100 text-neutral-500',
};

type Props = {
  variant?: Variant;
  children: ReactNode;
  className?: string;
};

export default function Badge({ variant = 'neutral', children, className }: Props) {
  const cls = [
    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
    variantClasses[variant],
    className,
  ].filter(Boolean).join(' ');

  return <span className={cls}>{children}</span>;
}
