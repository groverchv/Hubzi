import { useEffect, useState } from "react";
import { RefreshCw, Plus, Pencil, Trash2 } from "lucide-react";
import { apiFetch } from "../lib/api";
import { useSchoolStore } from "../store/schoolStore";
import { useAuthStore } from "../store/authStore";
import { Button, Table, Badge, ErrorBox, PageLoader, CopyButton, Modal, Input } from "../components/ui";

export default function DocentesPage() {
  const institution = useSchoolStore((s) => s.institution);
  const grades = useSchoolStore((s) => s.grades);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // "create" | "edit" | "created"
  const [form, setForm] = useState({ username: "", grade_ids: [] });
  const [editTarget, setEditTarget] = useState(null);
  const [createdInfo, setCreatedInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    apiFetch(`/api/v1/institutions/${institution.id}/teachers`)
      .then(setData).catch((e) => setError(e.message));
  };
  useEffect(load, [institution?.id]);

  const gradeNames = (ids) => ids.map((id) => grades.find((g) => g.id === id)?.name || "?").join(", ");

  const createTeacher = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const d = await apiFetch(`/api/v1/institutions/${institution.id}/teachers`, {
        method: "POST",
        body: { username: form.username, grade_ids: form.grade_ids },
      });
      setCreatedInfo(d.teacher);
      setModal("created");
      setForm({ username: "", grade_ids: [] });
      load();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch(`/api/v1/institutions/${institution.id}/teachers/${editTarget.id}`, {
        method: "PATCH",
        body: { username: form.username },
      });
      setModal(null);
      load();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const regenerateCredential = async (t) => {
    if (!confirm(`¿Regenerar la credencial de ${t.username}? La anterior deja de funcionar.`)) return;
    try {
      const d = await apiFetch(`/api/v1/institutions/${institution.id}/teachers/${t.id}`, {
        method: "PATCH",
        body: { regenerate_credential: true },
      });
      setCreatedInfo(d.teacher);
      setModal("created");
      load();
    } catch (e) { setError(e.message); }
  };

  const removeTeacher = async (t) => {
    if (!confirm(`¿Quitar a ${t.username} de la institución?`)) return;
    try { await apiFetch(`/api/v1/institutions/${institution.id}/teachers/${t.id}`, { method: "DELETE" }); load(); }
    catch (e) { setError(e.message); }
  };

  const toggleGrade = (gid) =>
    setForm((f) => ({
      ...f,
      grade_ids: f.grade_ids.includes(gid) ? f.grade_ids.filter((g) => g !== gid) : [...f.grade_ids, gid],
    }));

  if (!data) return <PageLoader />;
  const rows = [
    ...data.admins.map((a) => ({ ...a, role: "admin" })),
    ...data.teachers.map((t) => ({ ...t, role: "teacher" })),
  ];

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-slate-900">Docentes</h1>
        {isAdmin && (
          <Button size="sm" onClick={() => { setForm({ username: "", grade_ids: [] }); setModal("create"); }}>
            <Plus className="w-4 h-4" /> Nuevo docente
          </Button>
        )}
      </div>
      <ErrorBox error={error} />

      <Table rowKey="id" empty="Sin docentes aún."
        columns={[
          { key: "username", label: "Nombre" },
          { key: "email", label: "Correo" },
          { key: "school_credential", label: "Credencial", render: (t) => t.school_credential
            ? <span className="font-mono text-xs">{t.school_credential} <CopyButton text={t.school_credential} /></span>
            : <span className="text-slate-400">—</span> },
          { key: "role", label: "Rol", render: (t) => <Badge tone={t.role === "admin" ? "green" : "blue"}>{t.role === "admin" ? "Director" : "Docente"}</Badge> },
          { key: "grade_ids", label: "Grados", render: (t) => gradeNames(t.grade_ids || []) || <span className="text-slate-400">todos</span> },
          { key: "x", label: "", render: (t) => (
            isAdmin && t.role === "teacher" && (
              <div className="flex gap-1 justify-end">
                <Button size="sm" variant="ghost" title="Editar" onClick={() => { setEditTarget(t); setForm({ username: t.username, grade_ids: [] }); setModal("edit"); }}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="ghost" title="Regenerar credencial" onClick={() => regenerateCredential(t)}>
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="ghost" title="Quitar" onClick={() => removeTeacher(t)}>
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                </Button>
              </div>
            )
          )},
        ]}
        rows={rows}
      />

      <Modal open={modal === "create"} onClose={() => setModal(null)} title="Nuevo docente">
        <form onSubmit={createTeacher} className="space-y-4">
          <Input label="Nombre completo" value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          <div>
            <div className="text-xs font-semibold text-slate-600 mb-1">Asignar a grados</div>
            <div className="flex flex-wrap gap-2">
              {grades.map((g) => (
                <label key={g.id} className={`px-3 py-1.5 rounded-lg border text-xs cursor-pointer ${
                  form.grade_ids.includes(g.id) ? "bg-brand-600 text-white border-brand-600" : "border-slate-300 text-slate-600"}`}>
                  <input type="checkbox" className="hidden" checked={form.grade_ids.includes(g.id)} onChange={() => toggleGrade(g.id)} />
                  {g.name}
                </label>
              ))}
              {grades.length === 0 && <span className="text-xs text-slate-400">Crea grados primero</span>}
            </div>
          </div>
          <Button type="submit" loading={loading} className="w-full">Crear docente</Button>
        </form>
      </Modal>

      <Modal open={modal === "edit"} onClose={() => setModal(null)} title={`Editar — ${editTarget?.username}`}>
        <form onSubmit={saveEdit} className="space-y-4">
          <Input label="Nombre" value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          <Button type="submit" loading={loading} className="w-full">Guardar</Button>
        </form>
      </Modal>

      <Modal open={modal === "created"} onClose={() => setModal(null)} title="Credenciales del docente">
        <p className="text-sm text-slate-600 mb-3">
          Entrega estos datos a <strong>{createdInfo?.username}</strong> — la contraseña temporal solo se muestra aquí:
        </p>
        <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-2">
          <div><span className="font-semibold">Credencial (login escolar):</span> <code>{createdInfo?.school_credential}</code> <CopyButton text={createdInfo?.school_credential} /></div>
          <div><span className="font-semibold">Correo:</span> <code className="text-xs">{createdInfo?.email}</code></div>
          <div><span className="font-semibold">Contraseña temporal:</span> <code>{createdInfo?.password}</code> {createdInfo?.password && <CopyButton text={createdInfo?.password} />}</div>
        </div>
        <Button className="w-full mt-4" onClick={() => setModal(null)}>Listo</Button>
      </Modal>
    </div>
  );
}
