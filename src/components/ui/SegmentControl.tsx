type Option = {
  value: string;
  label: string;
};

type Props = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export default function SegmentControl({ options, value, onChange, className }: Props) {
  const cls = ['flex p-1 bg-neutral-100 rounded-lg', className].filter(Boolean).join(' ');

  return (
    <div className={cls}>
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={[
            'flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all active:scale-95',
            value === opt.value
              ? 'bg-neutral-0 text-neutral-900 shadow-xs'
              : 'text-neutral-500',
          ].join(' ')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
