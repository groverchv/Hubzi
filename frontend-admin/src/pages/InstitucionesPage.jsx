import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Ban, PlayCircle, Trash2 } from "lucide-react";
import { apiFetch } from "../lib/api";
import { Button, Input, Modal, Table, Badge, ErrorBox } from "../components/ui";

const PAGE_SIZE = 25;
const STATUS_FILTERS = [
  ["", "Todas"],
  ["active", "Activas"],
  ["trialing", "Trial"],
  ["suspended", "Suspendidas"],
  ["canceled", "Canceladas"],
];

export default function InstitucionesPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", admin_email: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(() => {
    const params = new URLSearchParams({ skip: String(skip), limit: String(PAGE_SIZE) });
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    apiFetch(`/api/v1/admin/institutions?${params}`)
      .then((d) => { setRows(d.institutions || []); setTotal(d.total || 0); })
      .catch((e) => setError(e.message));
  }, [skip, q, status]);
  useEffect(load, [load]);

  const create = async (e) => {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const d = await apiFetch("/api/v1/admin/institutions", {
        method: "POST",
        body: { name: form.name, admin_email: form.admin_email },
      });
      setModal(false);
      navigate(`/instituciones/${d.institution.id}`);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const setInstStatus = async (r, newStatus) => {
    if (!confirm(`¿${newStatus === "suspended" ? "Suspender" : "Reactivar"} "${r.name}"?`)) return;
    setError(null);
    try {
      await apiFetch(`/api/v1/admin/institutions/${r.id}`, { method: "PATCH", body: { status: newStatus } });
      load();
    } catch (e) { setError(e.message); }
  };

  const deleteInst = async (r) => {
    if (!confirm(`¿ELIMINAR "${r.name}"? Borra grados, materias y matrículas (las cuentas quedan desvinculadas). Escribe el nombre para confirmar:`)) return;
    const confirmText = prompt(`Escribe "${r.name}" para confirmar:`);
    if (confirmText !== r.name) { setError("Nombre incorrecto — no se eliminó."); return; }
    setError(null);
    try {
      await apiFetch(`/api/v1/admin/institutions/${r.id}`, { method: "DELETE" });
      load();
    } catch (e) { setError(e.message); }
  };

  const page = Math.floor(skip / PAGE_SIZE) + 1;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const subStatus = (r) => r.subscription?.status || "sin licencia";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Instituciones <span className="text-base font-normal text-slate-400">({total})</span></h1>
        <Button onClick={() => setModal(true)}><Plus className="w-4 h-4" /> Nueva institución</Button>
      </div>
      <ErrorBox error={error} />

      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_FILTERS.map(([v, label]) => (
          <button key={v} onClick={() => { setStatus(v); setSkip(0); }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${status === v ? "bg-brand-600 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>
            {label}
          </button>
        ))}
        <Input className="ml-auto !w-56" placeholder="Buscar por nombre…" value={q}
          onChange={(e) => { setQ(e.target.value); setSkip(0); }} />
      </div>

      <Table rowKey="id" empty="Sin instituciones."
        columns={[
          { key: "name", label: "Institución", render: (r) => (
            <button onClick={() => navigate(`/instituciones/${r.id}`)} className="font-semibold text-brand-700 hover:underline cursor-pointer text-left">{r.name}</button>
          )},
          { key: "status", label: "Licencia", render: (r) => <Badge tone={{ active: "green", trialing: "amber", suspended: "red", canceled: "slate" }[subStatus(r)] || "amber"}>{subStatus(r)}</Badge> },
          { key: "students_enrolled", label: "Estudiantes" },
          { key: "teachers_count", label: "Docentes" },
          { key: "grades_count", label: "Grados" },
          { key: "subjects_count", label: "Materias" },
          { key: "seats", label: "Seats", render: (r) => r.subscription?.seats ?? "—" },
          { key: "teacher_code", label: "PROF", render: (r) => <code className="text-xs">{r.teacher_code}</code> },
          { key: "x", label: "Acciones", render: (r) => (
            <div className="flex gap-1 justify-end">
              <Button size="sm" variant="ghost" title="Ver detalle" onClick={() => navigate(`/instituciones/${r.id}`)}><Eye className="w-3.5 h-3.5" /></Button>
              {subStatus(r) === "suspended"
                ? <Button size="sm" variant="ghost" title="Reactivar" onClick={() => setInstStatus(r, "active")}><PlayCircle className="w-3.5 h-3.5 text-emerald-600" /></Button>
                : <Button size="sm" variant="ghost" title="Suspender" onClick={() => setInstStatus(r, "suspended")}><Ban className="w-3.5 h-3.5 text-amber-600" /></Button>}
              <Button size="sm" variant="ghost" title="Eliminar" onClick={() => deleteInst(r)}><Trash2 className="w-3.5 h-3.5 text-rose-500" /></Button>
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

      <Modal open={modal} onClose={() => setModal(false)} title="Nueva institución">
        <form onSubmit={create} className="space-y-4">
          <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Email del director (cuenta existente)" type="email" value={form.admin_email}
            onChange={(e) => setForm({ ...form, admin_email: e.target.value })} required />
          <p className="text-xs text-slate-500">La cuenta debe existir — se le asigna rol admin y MFA obligatorio.</p>
          <Button type="submit" loading={loading} className="w-full">Crear y nombrar director</Button>
        </form>
      </Modal>
    </div>
  );
}
