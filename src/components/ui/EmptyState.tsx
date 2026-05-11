import type { ReactNode } from 'react';

type Props = {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
      <div className="text-neutral-400" aria-hidden="true">{icon}</div>
      <div className="flex flex-col gap-1">
        <h3 className="text-h3 font-heading text-neutral-900">{title}</h3>
        {description && <p className="text-body-sm text-neutral-600 font-sans">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
