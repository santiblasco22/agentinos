'use client';
import { useEffect, useState } from 'react';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

export type ToastKind = 'success' | 'error' | 'warning' | 'info';
interface ToastItem { id: number; kind: ToastKind; message: string; }

// ---- module-level pub/sub (no context/provider wiring needed) ----
type Listener = (t: ToastItem) => void;
const listeners = new Set<Listener>();
let counter = 0;

function emit(kind: ToastKind, message: string) {
  const item: ToastItem = { id: ++counter, kind, message };
  listeners.forEach((l) => l(item));
}

export const toast = {
  success: (m: string) => emit('success', m),
  error: (m: string) => emit('error', m),
  warning: (m: string) => emit('warning', m),
  info: (m: string) => emit('info', m),
};

const STYLES: Record<ToastKind, { color: string; Icon: typeof Check }> = {
  success: { color: '#10B981', Icon: Check },
  error: { color: '#EF4444', Icon: X },
  warning: { color: '#F59E0B', Icon: AlertTriangle },
  info: { color: '#00D4FF', Icon: Info },
};

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener: Listener = (t) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 3200);
    };
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const { color, Icon } = STYLES[t.kind];
        return (
          <div
            key={t.id}
            className="toast-item glass-card flex items-center gap-3 pl-3 pr-4 py-3 pointer-events-auto shadow-xl min-w-[240px] max-w-sm"
            style={{ borderColor: `${color}40` }}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
              <Icon size={15} color={color} />
            </div>
            <span className="text-sm font-medium" style={{ color: '#F0F4FF' }}>{t.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="ml-auto opacity-40 hover:opacity-100 transition-opacity flex-shrink-0"
              aria-label="Cerrar"
            >
              <X size={13} color="#9CA3AF" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
