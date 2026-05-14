import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export default function BottomSheet({ isOpen, onClose, title, children }: Props) {
  const titleId = useId();

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-neutral-900/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className="relative bg-neutral-0 rounded-t-xl shadow-lg max-h-[90vh] flex flex-col pb-safe"
      >
        <div className="flex justify-center py-3 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-neutral-200" aria-hidden="true" />
        </div>
        {title && (
          <div className="px-4 pb-3 border-b border-neutral-100 flex-shrink-0">
            <h2 id={titleId} className="text-h3 font-heading text-neutral-900">{title}</h2>
          </div>
        )}
        <div className="scroll-area px-4 py-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
