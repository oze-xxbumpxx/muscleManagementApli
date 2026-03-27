import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ToastVariant = 'info' | 'success' | 'error';

interface ToastState {
  message: string;
  variant: ToastVariant;
}

export interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
  dismissToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function toastVariantClasses(variant: ToastVariant): string {
  switch (variant) {
    case 'success': {
      return 'border-emerald-200 bg-emerald-50 text-emerald-900';
    }
    case 'error': {
      return 'border-red-200 bg-red-50 text-red-900';
    }
    case 'info':
    default: {
      return 'border-slate-200 bg-white text-slate-900';
    }
  }
}

export function ToastProvider({
  children,
}: {
  readonly children: ReactNode;
}): React.JSX.Element {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    setToast({ message, variant });
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  const value = useMemo((): ToastContextValue => {
    return { showToast, dismissToast };
  }, [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast !== null ? (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4"
          role="presentation"
        >
          <div
            className={`pointer-events-auto flex max-w-md items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${toastVariantClasses(
              toast.variant
            )}`}
            role="status"
            aria-live="polite"
          >
            <p className="flex-1 text-sm leading-relaxed">{toast.message}</p>
            <button
              type="button"
              onClick={dismissToast}
              className="shrink-0 rounded-md px-2 py-1 text-sm font-medium text-slate-600 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
            >
              閉じる
            </button>
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (ctx === null) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
