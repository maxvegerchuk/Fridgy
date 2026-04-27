import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export default function BottomSheet({ isOpen, onClose, title, children }: Props) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-neutral-0 rounded-t-3xl shadow-lg max-h-[90vh] flex flex-col pb-safe">
        {/* Drag handle */}
        <div className="flex justify-center pt-4 pb-1 flex-shrink-0">
          <div className="w-8 h-1 rounded-full bg-neutral-200" />
        </div>
        {title && (
          <div className="px-5 pb-4 pt-1 border-b border-neutral-100 flex-shrink-0">
            <h2 className="text-lg font-semibold text-neutral-900 font-display">{title}</h2>
          </div>
        )}
        <div className="scroll-area px-5 py-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
