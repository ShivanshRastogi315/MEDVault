import { AlertCircle, AlertTriangle, Info, CheckCircle2, X } from "lucide-react";

export default function AlertBanner({
  type = "info",
  title,
  message,
  onClose,
  className = "",
  actions,
}) {
  const styles = {
    error: {
      container: "bg-rose-50 border-rose-200 text-rose-900",
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
      titleColor: "text-rose-950 font-semibold",
    },
    warning: {
      container: "bg-amber-50 border-amber-200 text-amber-900",
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
      titleColor: "text-amber-950 font-semibold",
    },
    emergency: {
      container: "bg-red-500 text-white border-red-600 shadow-md",
      icon: <AlertTriangle className="w-5 h-5 text-white shrink-0 animate-bounce" />,
      titleColor: "text-white font-bold",
    },
    success: {
      container: "bg-emerald-50 border-emerald-200 text-emerald-900",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
      titleColor: "text-emerald-950 font-semibold",
    },
    info: {
      container: "bg-blue-50 border-blue-200 text-blue-900",
      icon: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
      titleColor: "text-blue-950 font-semibold",
    },
  };

  const current = styles[type] || styles.info;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-xl border text-sm transition-all duration-200 ${current.container} ${className}`}
    >
      <div className="mt-0.5">{current.icon}</div>
      <div className="flex-1">
        {title && <h4 className={`text-sm mb-0.5 ${current.titleColor}`}>{title}</h4>}
        {message && <div className="leading-relaxed opacity-95">{message}</div>}
        {actions && <div className="mt-2 flex items-center gap-2">{actions}</div>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 p-1 opacity-70 hover:opacity-100 transition-opacity rounded-lg"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
