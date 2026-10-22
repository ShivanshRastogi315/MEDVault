import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ size = "md", text = "Loading...", className = "" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-10 h-10",
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2.5 py-6 text-slate-500 ${className}`}>
      <Loader2 className={`${sizeClasses[size] || sizeClasses.md} animate-spin text-blue-600`} />
      {text && <span className="text-xs font-medium tracking-wide text-slate-500 animate-pulse">{text}</span>}
    </div>
  );
}
