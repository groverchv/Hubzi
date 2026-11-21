import { useCallback, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { Button, Input, Modal, Table, Badge, ErrorBox, PageLoader, Select, fmtDate } from "../components/ui";

const SUB_STATUSES = ["active", "trialing", "suspended", "canceled"];

export default function InstitucionDetailPage() {
  const { id } = useParams();
  const [d, setD] = useState(null);
  const [error, setError] = useState(null);
  const [confirm, setConfirm] = useState(""); // delete
  const [seats, setSeats] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const navigate = useNavigate();

  const load = useCallback(() => {
    apiFetch(`/api/v1/admin/institutions/${id}`).then(setD).catch((e) => setError(e.message));
  }, [id]);
  useEffect(load, [load]);

  const patch = async (body) => {
    try { await apiFetch(`/api/v1/admin/institutions/${id}`, { method: "PATCH", body }); load(); }
    catch (e) { setError(e.message); }
  };
  const destroy = async () => {
    try { await apiFetch(`/api/v1/admin/institutions/${id}`, { method: "DELETE" }); navigate("/instituciones"); }
    catch (e) { setError(e.message); }
  };
  const addAdmin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      // El endpoint toma user_id — resolvemos email → id primero
      const res = await apiFetch(`/api/v1/admin/users?q=${encodeURIComponent(adminEmail)}&limit=1`);
      const target = (res.users || []).find((u) => u.email.toLowerCase() === adminEmail.toLowerCase());
      if (!target) throw new Error("No existe una cuenta con ese email.");
      await apiFetch(`/api/v1/admin/institutions/${id}/admins`, { method: "POST", body: { user_id: target.id } });
      setAdminEmail("");
      load();
    } catch (err) { setError(err.message); }
  };
  const removeAdmin = async (uid) => {
    if (!confirm("¿Quitar este director?")) return;
    try { await apiFetch(`/api/v1/admin/institutions/${id}/admins/${uid}`, { method: "DELETE" }); load(); }
    catch (e) { setError(e.message); }
  };

  if (!d) return <PageLoader />;
  const inst = d.institution;
  const sub = inst.subscription || {};
  const members = d.members || { admins: [], teachers: [], students_count: 0 };
  const status = sub.status || "sin licencia";

  return (
    <div>
      <Link to="/instituciones" className="text-xs text-brand-700 hover:underline">← Instituciones</Link>
      <div className="flex items-center justify-between mt-1 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{inst.name}</h1>
        <Badge tone={{ active: "green", trialing: "amber", suspended: "red", canceled: "slate" }[status] || "amber"}>{status}</Badge>
      </div>
      <ErrorBox error={error} />

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-bold mb-3">Licencia</h2>
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <Field label="Estado" value={status} />
              <Field label="Seats" value={sub.seats ?? "—"} />
              <Field label="Activada" value={fmtDate(sub.activated_at)} />
              <Field label="PROF code" value={inst.teacher_code} />
            </div>
            <div className="flex gap-2 items-end">
              <Input label="Ajustar seats" type="number" min="0" placeholder={String(sub.seats ?? "")} value={seats} onChange={(e) => setSeats(e.target.value)} />
              <Button size="sm" variant="secondary" disabled={!seats}
                onClick={() => { patch({ seats: parseInt(seats, 10) }); setSeats(""); }}>Aplicar</Button>
            </div>
            <div className="flex gap-2 items-end mt-3">
              <Select label="Estado de licencia" value={sub.status || ""} onChange={(e) => e.target.value && patch({ status: e.target.value })}>
                <option value="" disabled>{status}</option>
                {SUB_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-bold mb-3">Directores ({members.admins.length})</h2>
            <div className="space-y-2 mb-3">
              {members.admins.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-semibold">{a.username}</div>
                    <div className="text-xs text-slate-500">{a.email}</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeAdmin(a.id)}>Quitar</Button>
                </div>
              ))}
            </div>
            <form onSubmit={addAdmin} className="flex gap-2">
              <Input placeholder="email de cuenta existente" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
              <Button type="submit" size="sm" variant="secondary">Añadir</Button>
            </form>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-bold mb-3">Docentes ({members.teachers.length})</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {members.teachers.map((t) => (
                <div key={t.id} className="text-sm">
                  <span className="font-semibold">{t.username}</span>
                  <span className="text-xs text-slate-500 ml-2">{t.email}</span>
                </div>
              ))}
              {!members.teachers.length && <p className="text-xs text-slate-400">Sin docentes</p>}
            </div>
          </section>

          <section className="bg-rose-50 rounded-xl border border-rose-200 p-5">
            <h2 className="font-bold text-rose-800 mb-3">Zona peligrosa</h2>
            <Button size="sm" variant="danger" onClick={() => setConfirm("delete")}>Eliminar institución…</Button>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-bold mb-3">Métricas</h2>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <Field label="Grados" value={(d.grades || []).length} />
              <Field label="Docentes" value={members.teachers.length} />
              <Field label="Estudiantes" value={members.students_count} />
              <Field label="Creada" value={fmtDate(inst.created_at)} />
              <Field label="ID" value={<code className="text-[10px]">{inst.id}</code>} />
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-bold mb-3">Grados ({(d.grades || []).length})</h2>
            <Table columns={[
              { key: "name", label: "Grado" },
              { key: "join_code", label: "Código", render: (g) => <code className="text-xs">{g.join_code}</code> },
              { key: "students", label: "Alumnos", render: (g) => (g.student_ids || []).length },
              { key: "folders", label: "Materias", render: (g) => (g.folder_ids || []).length },
            ]} rows={d.grades || []} empty="Sin grados" />
          </section>
        </div>
      </div>

      <Modal open={confirm === "delete"} onClose={() => setConfirm("")} title="Eliminar institución">
        <p className="text-sm text-slate-600 mb-4">
          Borra la institución, sus grados y matrículas. Las cuentas de usuarios NO se eliminan
          (las materias escolares pasan a ser personales del docente). Esta acción es irreversible.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirm("")}>Cancelar</Button>
          <Button variant="danger" onClick={destroy}>Eliminar definitivamente</Button>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg px-3 py-2">
      <div className="text-[10px] font-semibold uppercase text-slate-400">{label}</div>
      <div className="font-semibold truncate">{value ?? "—"}</div>
    </div>
  );
}
