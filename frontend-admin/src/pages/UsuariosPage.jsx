import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Ban, CheckCircle, Trash2 } from "lucide-react";
import { apiFetch } from "../lib/api";
import { Button, Input, Select, Table, Badge, ErrorBox, fmtDate } from "../components/ui";

const PAGE_SIZE = 25;
const ROLES = ["individual", "student", "teacher", "admin", "superadmin"];
const PLANS = ["free", "pro", "guest", "school"];
const ROLE_TONES = { individual: "slate", student: "blue", teacher: "violet", admin: "green", superadmin: "red" };

export default function UsuariosPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [plan, setPlan] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(() => {
    const params = new URLSearchParams({ skip: String(skip), limit: String(PAGE_SIZE) });
    if (q) params.set("q", q);
    if (role) params.set("role", role);
    if (plan) params.set("plan", plan);
    apiFetch(`/api/v1/admin/users?${params}`)
      .then((d) => { setRows(d.users || []); setTotal(d.total || 0); })
      .catch((e) => setError(e.message));
  }, [skip, q, role, plan]);
  useEffect(load, [load]);

  const toggleDisabled = async (u) => {
    if (!confirm(`¿${u.disabled ? "Habilitar" : "Deshabilitar"} a ${u.email}?`)) return;
    setError(null);
    try {
      await apiFetch(`/api/v1/admin/users/${u.id}`, { method: "PATCH", body: { disabled: !u.disabled } });
      load();
    } catch (e) { setError(e.message); }
  };

  const deleteUser = async (u) => {
    const confirmText = prompt(`ELIMINACIÓN GDPR de ${u.email} — borra su cuenta y todos sus datos. Escribe el email para confirmar:`);
    if (confirmText !== u.email) { if (confirmText !== null) setError("Email incorrecto — no se eliminó."); return; }
    setError(null);
    try {
      await apiFetch(`/api/v1/admin/users/${u.id}`, { method: "DELETE" });
      load();
    } catch (e) { setError(e.message); }
  };

  const page = Math.floor(skip / PAGE_SIZE) + 1;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Usuarios <span className="text-base font-normal text-slate-400">({total})</span></h1>
      <ErrorBox error={error} />

      <div className="flex flex-wrap gap-3 mb-4">
        <Input className="!w-64" placeholder="Buscar email o nombre…" value={q} onChange={(e) => { setQ(e.target.value); setSkip(0); }} />
        <Select className="!w-44" value={role} onChange={(e) => { setRole(e.target.value); setSkip(0); }}>
          <option value="">Todos los roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </Select>
        <Select className="!w-40" value={plan} onChange={(e) => { setPlan(e.target.value); setSkip(0); }}>
          <option value="">Todos los planes</option>
          {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
        </Select>
      </div>

      <Table rowKey="id" empty="Sin usuarios."
        columns={[
          { key: "email", label: "Email", render: (u) => (
            <button onClick={() => navigate(`/usuarios/${u.id}`)} className="font-semibold text-brand-700 hover:underline cursor-pointer text-left">{u.email}</button>
          )},
          { key: "username", label: "Nombre" },
          { key: "role", label: "Rol", render: (u) => <Badge tone={ROLE_TONES[u.role] || "slate"}>{u.role}</Badge> },
          { key: "plan", label: "Plan" },
          { key: "disabled", label: "Estado", render: (u) => u.disabled ? <Badge tone="red">deshabilitado</Badge> : <Badge tone="green">activo</Badge> },
          { key: "mfa_enabled", label: "MFA", render: (u) => u.mfa_enabled ? "✓" : "—" },
          { key: "created_at", label: "Registro", render: (u) => fmtDate(u.created_at) },
          { key: "x", label: "Acciones", render: (u) => (
            <div className="flex gap-1 justify-end">
              <Button size="sm" variant="ghost" title="Ver detalle" onClick={() => navigate(`/usuarios/${u.id}`)}><Eye className="w-3.5 h-3.5" /></Button>
              {u.disabled
                ? <Button size="sm" variant="ghost" title="Habilitar" onClick={() => toggleDisabled(u)}><CheckCircle className="w-3.5 h-3.5 text-emerald-600" /></Button>
                : <Button size="sm" variant="ghost" title="Deshabilitar" onClick={() => toggleDisabled(u)}><Ban className="w-3.5 h-3.5 text-amber-600" /></Button>}
              <Button size="sm" variant="ghost" title="Eliminar (GDPR)" onClick={() => deleteUser(u)}><Trash2 className="w-3.5 h-3.5 text-rose-500" /></Button>
            </div>
          )},
        ]}
        rows={rows}
      />

      <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
        <span>Página {page} de {pages} · mostrando {rows.length} de {total}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" disabled={skip <= 0} onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}>← Anterior</Button>
          <Button size="sm" variant="secondary" disabled={skip + PAGE_SIZE >= total} onClick={() => setSkip(skip + PAGE_SIZE)}>Siguiente →</Button>
        </div>
      </div>
    </div>
  );
}
