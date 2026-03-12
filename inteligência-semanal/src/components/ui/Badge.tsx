import { cn } from "../../lib/utils";

export function Badge({ children, variant = "default", className }: any) {
  const variants: any = {
    default: "bg-slate-100 text-slate-800",
    critical: "bg-rose-100 text-rose-800 border border-rose-200",
    warning: "bg-amber-100 text-amber-800 border border-amber-200",
    info: "bg-blue-100 text-blue-800 border border-blue-200",
    high: "bg-rose-100 text-rose-800 border border-rose-200",
    medium: "bg-amber-100 text-amber-800 border border-amber-200",
    low: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    quente: "bg-orange-100 text-orange-800 border border-orange-200",
    "muito-quente": "bg-red-100 text-red-800 border border-red-200",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", variants[variant] || variants.default, className)}>
      {children}
    </span>
  );
}
