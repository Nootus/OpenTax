"use client"

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// === Types ===
export type ToastType = "info" | "success" | "warning" | "error";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

export interface ToasterContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

// === Context & Hook ===
const ToasterContext = createContext<ToasterContextType | undefined>(undefined);

export function useToaster(): ToasterContextType {
  const ctx = useContext(ToasterContext);
  if (!ctx) throw new Error("useToaster must be used within ToasterProvider");
  return ctx;
}

// === Toast UI Component ===
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const variantClasses: Record<ToastType, string> = {
    info: "bg-blue-50 border-blue-200 text-slate-900",
    success: "bg-emerald-50 border-emerald-200 text-slate-900",
    warning: "bg-amber-50 border-amber-200 text-slate-900",
    error: "bg-red-50 border-red-200 text-slate-900",
  };

  const variant = variantClasses[toast.type ?? "info"];

  return (
    <div
      role="status"
      className={`pointer-events-auto min-w-[220px] max-w-[360px] border ${variant} rounded-md p-3 shadow-md`}
    >
      <div className="flex gap-2 items-start">
        <div className="flex-1">
          {toast.title && <div className="font-medium text-sm mb-0.5">{String(toast.title)}</div>}
          {toast.description && (
            <div className="text-sm text-slate-700">{String(toast.description)}</div>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          aria-label="Dismiss notification"
          className="bg-transparent border-0 text-lg leading-none p-1 hover:opacity-70 cursor-pointer"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// === Toast Container ===
function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null;
  
  return (
    <div 
      className="fixed z-50 top-25 left-1/2 transform -translate-x-1/2 flex flex-col gap-2 pointer-events-none"
      aria-live="polite" 
      aria-atomic="true"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

// === Provider ===
export interface ToasterProviderProps {
  children: React.ReactNode;
  defaultDuration?: number;
}

export function ToasterProvider({ children, defaultDuration = 5000 }: ToasterProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idCounter = useRef(0);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const removeToast = useCallback((id: string) => {
    setToasts((s) => s.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const addToast = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = `toast-${++idCounter.current}`;
      const toast: Toast = {
        id,
        title: typeof t.title === 'string' ? t.title : undefined,
        description: typeof t.description === 'string' ? t.description : undefined,
        type: t.type ?? "info",
        duration: typeof t.duration === "number" ? t.duration : defaultDuration,
      };
      setToasts((s) => [toast, ...s]);

      if (toast.duration && toast.duration > 0) {
        timers.current[id] = setTimeout(() => removeToast(id), toast.duration);
      }

      return id;
    },
    [defaultDuration, removeToast]
  );

  const clearToasts = useCallback(() => {
    Object.values(timers.current).forEach(clearTimeout);
    timers.current = {};
    setToasts([]);
  }, []);

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <ToasterContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToasterContext.Provider>
  );
}

export default ToasterProvider;
