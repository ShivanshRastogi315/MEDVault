import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info", duration = 4000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => showToast(msg, "success", dur),
    error: (msg, dur) => showToast(msg, "error", dur || 5000),
    warning: (msg, dur) => showToast(msg, "warning", dur),
    info: (msg, dur) => showToast(msg, "info", dur),
  };

  return (
    <ToastContext.Provider value={{ toast, showToast, removeToast }}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => {
          const isSuccess = t.type === "success";
          const isError = t.type === "error";
          const isWarning = t.type === "warning";

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-200 animate-in slide-in-from-bottom-3 ${
                isSuccess
                  ? "bg-emerald-50/95 border-emerald-200 text-emerald-900"
                  : isError
                  ? "bg-rose-50/95 border-rose-200 text-rose-900"
                  : isWarning
                  ? "bg-amber-50/95 border-amber-200 text-amber-900"
                  : "bg-blue-50/95 border-blue-200 text-blue-900"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-600" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                {!isSuccess && !isError && !isWarning && (
                  <Info className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div className="flex-1 text-sm font-medium leading-snug">
                {t.message}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-0.5 -mr-1"
                aria-label="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context.toast;
}
