type Variant = 'text' | 'circle' | 'rect';

const variantCls: Record<Variant, string> = {
  text:   'h-4 rounded-md',
  circle: 'rounded-full',
  rect:   'rounded-lg',
};

type Props = {
  variant?: Variant;
  className?: string;
};

export default function Skeleton({ variant = 'rect', className }: Props) {
  const cls = ['animate-pulse bg-neutral-200', variantCls[variant], className].filter(Boolean).join(' ');
  return <div className={cls} />;
}
