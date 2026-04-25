import type { ReactNode } from 'react';

type Props = {
  emoji: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function EmptyState({ emoji, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
      <span className="text-5xl" aria-hidden="true">{emoji}</span>
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
        {description && <p className="text-sm text-neutral-500">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
