import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

// ============================================================
// Types
// ============================================================

type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface AdminToastContextValue {
  showToast: (type: ToastType, message: string) => void;
}

// ============================================================
// Context
// ============================================================

const DURATION = 3000;
let nextId = 1;

const Ctx = createContext<AdminToastContextValue | null>(null);

// ============================================================
// Provider
// ============================================================

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, DURATION);
  }, []);

  function dismiss(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <Ctx.Provider value={{ showToast }}>
      {children}

      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-bottom-4 fade-in duration-200 ${
                toast.type === 'success'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-red-600 text-white'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{toast.message}</span>
              <button
                onClick={() => dismiss(toast.id)}
                className="ml-2 p-0.5 rounded hover:bg-white/20 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Ctx.Provider>
  );
}

// ============================================================
// Hook
// ============================================================

export function useAdminToast(): AdminToastContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAdminToast() must be used within <AdminToastProvider>');
  return ctx;
}
