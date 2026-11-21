import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { Select, Table, ErrorBox, fmtDate } from "../components/ui";

// Tipos reales que emite el audit log (security_events.type)
const TYPES = [
  "", "login_ok", "login_failed", "register", "guest_migrated",
  "admin_action", "institution_create", "institution_patch", "institution_delete",
  "institution_admin_add", "institution_admin_remove", "user_patch", "user_delete",
  "superadmin_add", "superadmin_remove", "password_reset", "mfa_enabled", "account_disabled",
];

export default function SeguridadPage() {
  const [rows, setRows] = useState([]);
  const [type, setType] = useState("");
  const [limit, setLimit] = useState("100");
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    const params = new URLSearchParams({ limit });
    if (type) params.set("type", type);
    apiFetch(`/api/v1/admin/security-events?${params}`)
      .then((d) => setRows(d.events || []))
      .catch((e) => setError(e.message));
  }, [type, limit]);
  useEffect(load, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Auditoría / seguridad</h1>
        <div className="flex gap-3">
          <Select className="!w-56" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => <option key={t} value={t}>{t || "Todos los tipos"}</option>)}
          </Select>
          <Select className="!w-28" value={limit} onChange={(e) => setLimit(e.target.value)}>
            {["50", "100", "200"].map((l) => <option key={l} value={l}>últimos {l}</option>)}
          </Select>
        </div>
      </div>
      <ErrorBox error={error} />
      <Table columns={[
        { key: "created_at", label: "Fecha", render: (r) => fmtDate(r.created_at) },
        { key: "type", label: "Tipo", render: (r) => <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{r.type}</code> },
        { key: "actor_id", label: "Actor", render: (r) => <code className="text-xs text-slate-500">{(r.actor_id || "—").slice(-6)}</code> },
        { key: "ip", label: "IP", render: (r) => <span className="text-xs">{r.ip || "—"}</span> },
        { key: "detail", label: "Detalle", render: (r) => <span className="text-xs text-slate-500">{r.detail && Object.keys(r.detail).length ? JSON.stringify(r.detail).slice(0, 140) : "—"}</span> },
      ]} rows={rows} empty="Sin eventos" />
      <p className="text-xs text-slate-400 mt-3">{rows.length} eventos · los cambios administrativos quedan auditados aquí.</p>
    </div>
  );
}
