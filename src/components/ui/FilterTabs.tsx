type Tab = {
  value: string;
  label: string;
  count?: number;
};

type Props = {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export default function FilterTabs({ tabs, value, onChange, className }: Props) {
  const cls = ['flex gap-2 overflow-x-auto no-scrollbar pb-1', className].filter(Boolean).join(' ');

  return (
    <div className={cls}>
      {tabs.map(tab => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={[
            'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
            'active:scale-95 transition-all whitespace-nowrap min-h-[36px]',
            value === tab.value
              ? 'bg-green-500 text-white'
              : 'bg-neutral-100 text-neutral-600',
          ].join(' ')}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={['text-xs', value === tab.value ? 'text-green-100' : 'text-neutral-400'].join(' ')}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
