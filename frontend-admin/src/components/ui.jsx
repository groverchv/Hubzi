import { X, Loader2 } from "lucide-react";

export function Spinner({ className = "w-5 h-5" }) {
  return <Loader2 className={`${className} animate-spin`} />;
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <Spinner className="w-8 h-8" />
    </div>
  );
}

export function Button({ children, variant = "primary", size = "md", loading = false, className = "", ...props }) {
  const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
  const sizes = { sm: "px-2.5 py-1.5 text-xs", md: "px-4 py-2 text-sm" };
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    ghost: "text-slate-600 hover:bg-slate-100",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <Spinner className="w-4 h-4" />}
      {children}
    </button>
  );
}

export function Input({ label, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>}
      <input className={`w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${className}`} {...props} />
    </label>
  );
}

export function Select({ label, children, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>}
      <select className={`w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 ${className}`} {...props}>
        {children}
      </select>
    </label>
  );
}

export function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-rose-100 text-rose-800",
    blue: "bg-sky-100 text-sky-800",
    violet: "bg-violet-100 text-violet-800",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function Stat({ label, value, hint, icon: Icon }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
      </div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-xl w-full ${wide ? "max-w-3xl" : "max-w-md"} max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Table({ columns, rows, empty = "Sin datos", rowKey }) {
  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {columns.map((c) => (
              <th key={c.key} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">{empty}</td></tr>
          )}
          {rows.map((r, i) => (
            <tr key={rowKey ? r[rowKey] : i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
              {columns.map((c) => <td key={c.key} className="px-4 py-3">{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ErrorBox({ error }) {
  if (!error) return null;
  return <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-4 py-3 mb-4">{String(error)}</div>;
}

export function fmtDate(v) {
  if (!v) return "—";
  try { return new Date(v).toLocaleString(); } catch { return String(v); }
}
