import { useCallback, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { Button, Select, Modal, Badge, ErrorBox, PageLoader, fmtDate } from "../components/ui";
import { useAuthStore } from "../store/authStore";

const ROLES = ["individual", "student", "teacher", "admin"];
const PLANS = ["free", "pro", "guest", "school"];

export default function UsuarioDetailPage() {
  const { id } = useParams();
  const [d, setD] = useState(null);
  const [error, setError] = useState(null);
  const [confirm, setConfirm] = useState(""); // delete | kick
  const me = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const load = useCallback(() => {
    apiFetch(`/api/v1/admin/users/${id}`).then(setD).catch((e) => setError(e.message));
  }, [id]);
  useEffect(load, [load]);

  const patch = async (body) => {
    try { await apiFetch(`/api/v1/admin/users/${id}`, { method: "PATCH", body }); load(); }
    catch (e) { setError(e.message); }
  };
  const kick = async () => {
    // No hay endpoint de sesiones — reset_sessions es un flag del PATCH
    await patch({ reset_sessions: true });
    setConfirm("");
  };
  const destroy = async () => {
    try { await apiFetch(`/api/v1/admin/users/${id}`, { method: "DELETE" }); navigate("/usuarios"); }
    catch (e) { setError(e.message); }
  };

  if (!d) return <PageLoader />;
  const u = d.user;
  const isSelf = me?.id === u.id;
  const sessions = d.active_sessions || [];

  return (
    <div className="max-w-4xl">
      <Link to="/usuarios" className="text-xs text-brand-700 hover:underline">← Usuarios</Link>
      <div className="flex items-center justify-between mt-1 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{u.username} {isSelf && <span className="text-sm text-slate-400">(tú)</span>}</h1>
        <div className="flex gap-2">
          <Badge tone={{ individual: "slate", student: "blue", teacher: "violet", admin: "green", superadmin: "red" }[u.role] || "slate"}>{u.role}</Badge>
          {u.disabled && <Badge tone="red">deshabilitado</Badge>}
          {u.school_managed && <Badge tone="blue">cuenta escolar</Badge>}
        </div>
      </div>
      <ErrorBox error={error} />

      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-bold mb-3">Cuenta</h2>
          <dl className="text-sm space-y-2 mb-4">
            <Row k="Email" v={u.email} />
            <Row k="Plan" v={u.plan} />
            <Row k="Rol" v={u.role} />
            <Row k="Institución" v={u.institution_id || "—"} />
            <Row k="Email verificado" v={u.email_verified ? "sí" : "no"} />
            <Row k="MFA" v={u.mfa_enabled ? "activo" : "—"} />
            <Row k="Registrado" v={fmtDate(u.created_at)} />
            <Row k="Sesiones activas" v={sessions.length} />
          </dl>

          <div className="flex gap-2 items-end">
            <Select label="Plan" value={u.plan} onChange={(e) => patch({ plan: e.target.value })}>
              {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
            <Select label="Rol" value={u.role} disabled={isSelf || u.role === "superadmin"} onChange={(e) => patch({ role: e.target.value })}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              {u.role === "superadmin" && <option value="superadmin">superadmin</option>}
            </Select>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-bold mb-3">Carpetas ({(d.folders || []).length})</h2>
          <div className="space-y-2 max-h-56 overflow-y-auto text-sm">
            {(d.folders || []).map((f) => (
              <div key={f.id} className="flex justify-between border-b border-slate-100 pb-1.5">
                <span>{f.name} {f.is_school_folder && <Badge tone="blue">escolar</Badge>}</span>
                <span className="text-xs text-slate-400">{f.documents_count} docs</span>
              </div>
            ))}
            {!(d.folders || []).length && <p className="text-xs text-slate-400">Sin carpetas</p>}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-bold mb-3">Sesiones ({sessions.length})</h2>
          <div className="space-y-1.5 max-h-40 overflow-y-auto text-xs mb-3">
            {sessions.map((s, i) => (
              <div key={i} className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500 truncate max-w-[60%]">{s.user_agent || s.ip || "sesión"}</span>
                <span className="text-slate-400">{fmtDate(s.last_seen)}</span>
              </div>
            ))}
            {!sessions.length && <p className="text-slate-400">Sin sesiones activas</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => setConfirm("kick")} disabled={!sessions.length}>Cerrar sesiones</Button>
            {u.disabled ? (
              <Button size="sm" variant="secondary" onClick={() => patch({ disabled: false })}>Rehabilitar</Button>
            ) : (
              <Button size="sm" variant="secondary" disabled={isSelf} onClick={() => patch({ disabled: true })}>Deshabilitar</Button>
            )}
          </div>
        </section>

        <section className="bg-rose-50 rounded-xl border border-rose-200 p-5">
          <h2 className="font-bold text-rose-800 mb-2">Eliminación GDPR</h2>
          <p className="text-xs text-rose-700 mb-3">Borra la cuenta y TODOS sus datos (carpetas, progreso, sesiones). Irreversible.</p>
          <Button size="sm" variant="danger" disabled={isSelf} onClick={() => setConfirm("delete")}>Eliminar usuario…</Button>
        </section>
      </div>

      <Modal open={confirm === "kick"} onClose={() => setConfirm("")} title="Cerrar sesiones">
        <p className="text-sm text-slate-600 mb-4">Invalida todos los JWT activos — el usuario deberá volver a entrar.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirm("")}>Cancelar</Button>
          <Button variant="danger" onClick={kick}>Cerrar sesiones</Button>
        </div>
      </Modal>
      <Modal open={confirm === "delete"} onClose={() => setConfirm("")} title={`Eliminar a ${u.email}`}>
        <p className="text-sm text-slate-600 mb-4">Se elimina la cuenta completa (derecho al olvido). No hay vuelta atrás.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirm("")}>Cancelar</Button>
          <Button variant="danger" onClick={destroy}>Eliminar definitivamente</Button>
        </div>
      </Modal>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between border-b border-slate-100 pb-1.5 gap-3">
      <dt className="text-slate-500 shrink-0">{k}</dt><dd className="font-medium truncate">{v}</dd>
    </div>
  );
}
