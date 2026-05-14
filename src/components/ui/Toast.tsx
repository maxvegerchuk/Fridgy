import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

type ToastVariant = 'success' | 'error' | 'info';

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextType = {
  toast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const variantCls: Record<ToastVariant, string> = {
    success: 'bg-green-500 text-white',
    error:   'bg-red-500 text-white',
    info:    'bg-neutral-800 text-white',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Error / info — top */}
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col gap-2 px-4 pointer-events-none" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}>
        {toasts.filter(t => t.variant !== 'success').map(t => (
          <div
            key={t.id}
            className={['rounded-lg px-4 py-3 text-body-sm font-medium font-sans shadow-md pointer-events-auto', variantCls[t.variant]].join(' ')}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Success — bottom */}
      <div className="fixed left-0 right-0 z-50 flex flex-col gap-2 px-4 pointer-events-none" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
        {toasts.filter(t => t.variant === 'success').map(t => (
          <div
            key={t.id}
            className={['rounded-lg px-4 py-3 text-body-sm font-medium font-sans shadow-md pointer-events-auto', variantCls.success].join(' ')}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType['toast'] {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.toast;
}
