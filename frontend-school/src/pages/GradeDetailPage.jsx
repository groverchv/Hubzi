import { useCallback, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Plus, RefreshCw, Trash2, KeyRound, FileUp, Printer, ArrowRightLeft } from "lucide-react";
import { apiFetch, uploadWithProgress } from "../lib/api";
import { useSchoolStore } from "../store/schoolStore";
import { useAuthStore } from "../store/authStore";
import {
  Button, Input, Modal, Table, Badge, ErrorBox, PageLoader, Select, CopyButton,
} from "../components/ui";

const TABS = [
  ["estudiantes", "Estudiantes"],
  ["materias", "Materias"],
  ["docentes", "Docentes"],
  ["progreso", "Progreso"],
  ["asignar", "Asignaciones"],
  ["ajustes", "Ajustes"],
];

export default function GradeDetailPage() {
  const { gradeId } = useParams();
  const grades = useSchoolStore((s) => s.grades);
  const grade = grades.find((g) => g.id === gradeId);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const [tab, setTab] = useState("estudiantes");

  return (
    <div>
      <div className="mb-5">
        <Link to="/grados" className="text-xs text-brand-700 hover:underline">← Grados</Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">
          {grade?.name || "Grado"}
          {grade?.join_code && (
            <span className="ml-3 text-sm font-mono font-normal text-slate-500">
              {grade.join_code} <CopyButton text={grade.join_code} />
            </span>
          )}
        </h1>
      </div>
      <div className="flex gap-1 mb-5 border-b border-slate-200 overflow-x-auto">
        {TABS.filter(([k]) => k !== "docentes" || isAdmin).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg cursor-pointer whitespace-nowrap ${
              tab === k ? "bg-white border border-b-0 border-slate-200 text-brand-700" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "estudiantes" && <StudentsTab gradeId={gradeId} />}
      {tab === "materias" && <SubjectsTab gradeId={gradeId} />}
      {tab === "docentes" && isAdmin && <TeachersTab gradeId={gradeId} />}
      {tab === "progreso" && <ProgressTab gradeId={gradeId} />}
      {tab === "asignar" && <AssignTab gradeId={gradeId} />}
      {tab === "ajustes" && <SettingsTab grade={grade} gradeId={gradeId} isAdmin={isAdmin} />}
    </div>
  );
}

/* ── Estudiantes ─────────────────────────────────────────── */

function StudentsTab({ gradeId }) {
  const grades = useSchoolStore((s) => s.grades);
  const [students, setStudents] = useState(null);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // single | bulk | creds | move
  const [created, setCreated] = useState([]);
  const [form, setForm] = useState({ username: "", age: "" });
  const [csv, setCsv] = useState("");
  const [moveTarget, setMoveTarget] = useState({ sid: null, gid: "" });
  const [resetInfo, setResetInfo] = useState(null);
  const isAdmin = useAuthStore((s) => s.isAdmin);

  const load = useCallback(() => {
    apiFetch(`/api/v1/institutions/grades/${gradeId}/students`)
      .then((d) => setStudents(d.students))
      .catch((e) => setError(e.message));
  }, [gradeId]);
  useEffect(load, [load]);

  const enroll = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const d = await apiFetch(`/api/v1/institutions/grades/${gradeId}/students`, {
        method: "POST",
        body: { username: form.username, age: parseInt(form.age, 10) || undefined },
      });
      setCreated([d.created]);
      setModal("creds");
      setForm({ username: "", age: "" });
      load();
    } catch (err) { setError(err.message); }
  };

  const bulk = async (e) => {
    e.preventDefault();
    setError(null);
    // Una línea por alumno: "Nombre[, edad][, contraseña]"
    const students = csv.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const [username, age, password] = l.split(",").map((s) => s.trim());
      return { username, age: parseInt(age, 10) || undefined, password: password || undefined };
    });
    try {
      const d = await apiFetch(`/api/v1/institutions/grades/${gradeId}/students/bulk`, {
        method: "POST", body: { students },
      });
      setCreated(d.created);
      setModal("creds");
      setCsv("");
      load();
    } catch (err) { setError(err.message); }
  };

  const act = async (path, then) => {
    setError(null);
    try {
      const d = await apiFetch(`/api/v1/institutions/grades/${gradeId}${path}`, { method: "POST" });
      then?.(d);
      load();
    } catch (err) { setError(err.message); }
  };

  const unenroll = async (sid) => {
    if (!confirm("¿Desmatricular a este estudiante del grado?")) return;
    setError(null);
    try {
      await apiFetch(`/api/v1/institutions/grades/${gradeId}/students/${sid}`, { method: "DELETE" });
      load();
    } catch (err) { setError(err.message); }
  };

  const downloadCsv = () => {
    const rows = [["username", "email", "password"], ...created.map((c) => [c.username, c.email, c.password])];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "credenciales-estudiantes.csv";
    a.click();
  };

  if (!students) return <PageLoader />;
  return (
    <div>
      <ErrorBox error={error} />
      <div className="flex gap-2 mb-4">
        <Button size="sm" onClick={() => setModal("single")}><Plus className="w-4 h-4" /> Matricular</Button>
        <Button size="sm" variant="secondary" onClick={() => setModal("bulk")}>Importar lista (CSV)</Button>
      </div>
      <Table rowKey="id" empty="Sin estudiantes matriculados."
        columns={[
          { key: "username", label: "Nombre" },
          { key: "email", label: "Cuenta", render: (s) => <span className="font-mono text-xs">{s.email}</span> },
          { key: "school_credential", label: "Credencial", render: (s) => s.school_credential
            ? <span className="font-mono text-xs">{s.school_credential} <CopyButton text={s.school_credential} /></span>
            : <span className="text-slate-400">—</span> },
          { key: "must_change_password", label: "Contraseña", render: (s) => s.must_change_password ? <Badge tone="amber">temporal</Badge> : <Badge tone="green">propia</Badge> },
          { key: "x", label: "", render: (s) => (
            <div className="flex gap-1 justify-end">
              <Button size="sm" variant="ghost" title="Reset contraseña" onClick={() => act(`/students/${s.id}/reset-password`, (d) => setResetInfo(d))}><KeyRound className="w-3.5 h-3.5" /></Button>
              {isAdmin && <Button size="sm" variant="ghost" title="Mover de grado" onClick={() => setMoveTarget({ sid: s.id, gid: "" }) || setModal("move")}><ArrowRightLeft className="w-3.5 h-3.5" /></Button>}
              <Button size="sm" variant="ghost" title="Desmatricular" onClick={() => unenroll(s.id)}><Trash2 className="w-3.5 h-3.5 text-rose-500" /></Button>
            </div>
          )},
        ]}
        rows={students}
      />

      <Modal open={modal === "single"} onClose={() => setModal(null)} title="Matricular estudiante">
        <form onSubmit={enroll} className="space-y-4">
          <Input label="Nombre completo" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          <Input label="Edad (opcional)" type="number" min="4" max="120" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
          <Button type="submit" className="w-full">Crear cuenta</Button>
        </form>
      </Modal>

      <Modal open={modal === "bulk"} onClose={() => setModal(null)} title="Matrícula masiva" wide>
        <form onSubmit={bulk} className="space-y-4">
          <p className="text-xs text-slate-500">Una línea por estudiante: <code>Nombre[, edad][, contraseña]</code></p>
          <textarea className="w-full h-48 px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
            placeholder={"Ana Pérez, 15\nLuis Gómez\nMaría Rojas, 14, clave123"}
            value={csv} onChange={(e) => setCsv(e.target.value)} required />
          <Button type="submit" className="w-full">Crear {csv.split("\n").filter((l) => l.trim()).length} cuentas</Button>
        </form>
      </Modal>

      <Modal open={modal === "creds"} onClose={() => setModal(null)} title="Credenciales generadas" wide>
        <p className="text-sm text-slate-600 mb-3">Entrega estas credenciales a los estudiantes. Deberán cambiar su contraseña al primer ingreso.</p>
        <div className="max-h-64 overflow-y-auto mb-4">
          <Table rowKey="email" columns={[
            { key: "username", label: "Nombre" },
            { key: "email", label: "Usuario" },
            { key: "password", label: "Contraseña" },
          ]} rows={created} />
        </div>
        <Button onClick={downloadCsv} className="w-full">Descargar CSV</Button>
      </Modal>

      <Modal open={modal === "move"} onClose={() => setModal(null)} title="Mover a otro grado">
        <div className="space-y-4">
          <Select label="Grado destino" value={moveTarget.gid} onChange={(e) => setMoveTarget({ ...moveTarget, gid: e.target.value })}>
            <option value="">— elegir —</option>
            {grades.filter((g) => g.id !== gradeId).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
          <Button className="w-full" disabled={!moveTarget.gid}
            onClick={async () => {
              await act(`/students/${moveTarget.sid}/move`, null).catch(() => {});
              try {
                await apiFetch(`/api/v1/institutions/grades/${gradeId}/students/${moveTarget.sid}/move`,
                  { method: "POST", body: { target_grade_id: moveTarget.gid } });
                setModal(null); load();
              } catch (err) { setError(err.message); }
            }}>
            Mover
          </Button>
        </div>
      </Modal>

      <Modal open={Boolean(resetInfo)} onClose={() => setResetInfo(null)} title="Contraseña restablecida">
        <p className="text-sm text-slate-600 mb-3">Nueva contraseña temporal para <strong>{resetInfo?.username}</strong>:</p>
        <div className="font-mono text-lg bg-slate-100 rounded-lg p-4 text-center mb-3">{resetInfo?.password}</div>
        <p className="text-xs text-slate-500">Sus sesiones quedaron cerradas y deberá cambiarla al entrar.</p>
      </Modal>
    </div>
  );
}

/* ── Materias ─────────────────────────────────────────── */

function SubjectsTab({ gradeId }) {
  const [folders, setFolders] = useState(null);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => {
    apiFetch(`/api/v1/institutions/grades/${gradeId}/folders`)
      .then((d) => setFolders(d.folders)).catch((e) => setError(e.message));
  }, [gradeId]);
  useEffect(load, [load]);

  const create = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/v1/institutions/grades/${gradeId}/folders`, { method: "POST", body: { name } });
      setModal(false); setName(""); load();
    } catch (err) { setError(err.message); }
  };

  const uploadDoc = async (fid, file) => {
    setBusy(fid);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await uploadWithProgress(`/api/v1/folders/${fid}/upload-document`, fd);
      load();
    } catch (err) { setError(err.message); } finally { setBusy(null); }
  };

  const detectTopics = async (fid) => {
    setBusy(fid);
    try { await apiFetch(`/api/v1/folders/${fid}/detect-topics`, { method: "POST" }); load(); }
    catch (err) { setError(err.message); } finally { setBusy(null); }
  };

  const remove = async (fid) => {
    if (!confirm("¿Eliminar esta materia y su progreso?")) return;
    try { await apiFetch(`/api/v1/folders/${fid}`, { method: "DELETE" }); load(); }
    catch (err) { setError(err.message); }
  };

  if (!folders) return <PageLoader />;
  return (
    <div>
      <ErrorBox error={error} />
      <div className="mb-4"><Button size="sm" onClick={() => setModal(true)}><Plus className="w-4 h-4" /> Nueva materia</Button></div>
      <div className="grid gap-4 md:grid-cols-2">
        {folders.length === 0 && <p className="text-sm text-slate-400 col-span-2 py-8 text-center">Sin materias — crea la primera.</p>}
        {folders.map((f) => (
          <div key={f.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900">{f.name}</h3>
                <p className="text-xs text-slate-500">{f.documents_count} docs · {(f.islands || []).length} islas · {f.owner_name || "—"}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => remove(f.id)}><Trash2 className="w-4 h-4 text-rose-500" /></Button>
            </div>
            {(f.islands || []).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {f.islands.map((i) => <Badge key={i.id} tone="blue">{i.name}</Badge>)}
              </div>
            )}
            {f.assignment && <p className="text-xs text-amber-700 mt-2">📌 {f.assignment.title}{f.assignment.due_date ? ` · ${f.assignment.due_date}` : ""}</p>}
            <div className="flex gap-2 mt-3">
              <label className="flex-1">
                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => e.target.files[0] && uploadDoc(f.id, e.target.files[0])} />
                <span className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer">
                  <FileUp className="w-3.5 h-3.5" /> {busy === f.id ? "Subiendo…" : "Subir doc"}
                </span>
              </label>
              <Button size="sm" variant="secondary" className="flex-1" disabled={busy === f.id} onClick={() => detectTopics(f.id)}>
                <RefreshCw className="w-3.5 h-3.5" /> Detectar temas
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="Nueva materia">
        <form onSubmit={create} className="space-y-4">
          <Input label="Nombre de la materia" placeholder="Matemáticas" value={name} onChange={(e) => setName(e.target.value)} required />
          <Button type="submit" className="w-full">Crear materia</Button>
        </form>
      </Modal>
    </div>
  );
}

/* ── Docentes del grado (admin) ────────────────────────── */

function TeachersTab({ gradeId }) {
  const institution = useSchoolStore((s) => s.institution);
  const grades = useSchoolStore((s) => s.grades);
  const grade = grades.find((g) => g.id === gradeId);
  const refresh = useSchoolStore((s) => s.refresh);
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch(`/api/v1/institutions/${institution.id}/teachers`)
      .then((d) => setTeachers([...d.teachers, ...d.admins.map((a) => ({ ...a, role: "admin" }))]))
      .catch((e) => setError(e.message));
  }, [institution?.id]);

  const assigned = new Set(grade?.teacher_ids || []);
  const toggle = async (tid) => {
    const next = assigned.has(tid) ? [...assigned].filter((t) => t !== tid) : [...assigned, tid];
    try {
      await apiFetch(`/api/v1/institutions/grades/${gradeId}/teachers`, { method: "PATCH", body: { teacher_ids: next } });
      await refresh();
    } catch (err) { setError(err.message); }
  };

  return (
    <div>
      <ErrorBox error={error} />
      <p className="text-sm text-slate-500 mb-4">Marca los docentes que gestionan este grado.</p>
      <div className="space-y-2 max-w-lg">
        {teachers.map((t) => (
          <label key={t.id} className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 px-4 py-3 cursor-pointer">
            <input type="checkbox" checked={assigned.has(t.id)} onChange={() => toggle(t.id)} className="w-4 h-4 accent-brand-600" />
            <div className="flex-1">
              <div className="text-sm font-semibold">{t.username}</div>
              <div className="text-xs text-slate-500">{t.email}</div>
            </div>
            <Badge tone={t.role === "admin" ? "green" : "blue"}>{t.role}</Badge>
          </label>
        ))}
        {teachers.length === 0 && <p className="text-sm text-slate-400">Sin docentes — invítalos desde la sección Docentes.</p>}
      </div>
    </div>
  );
}

/* ── Progreso ──────────────────────────────────────────── */

function ProgressTab({ gradeId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);

  useEffect(() => {
    apiFetch(`/api/v1/institutions/grades/${gradeId}/dashboard`)
      .then(setData).catch((e) => setError(e.message));
  }, [gradeId]);

  const openReport = async (sid) => {
    try {
      const d = await apiFetch(`/api/v1/institutions/grades/${gradeId}/students/${sid}/report`);
      setReport(d);
    } catch (err) { setError(err.message); }
  };

  if (!data) return <PageLoader />;
  return (
    <div>
      <ErrorBox error={error} />
      {(data.weak_topics || []).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <h3 className="text-sm font-bold text-amber-800 mb-2">Temas débiles del curso</h3>
          <div className="flex flex-wrap gap-2">
            {data.weak_topics.slice(0, 8).map((w) => (
              <Badge key={w.topic} tone="amber">{w.topic} · {w.students} alumnos</Badge>
            ))}
          </div>
        </div>
      )}
      <Table rowKey="student_id" empty="Sin progreso aún."
        columns={[
          { key: "username", label: "Estudiante" },
          { key: "subjects", label: "Materias / islas", render: (s) => (
            <div className="space-y-1">
              {(s.subjects || []).map((sub) => (
                <div key={sub.folder_id} className="text-xs">
                  <span className="font-semibold">{sub.subject}</span>
                  {(sub.islands || []).map((i) => (
                    <span key={i.island_id} className="ml-2 text-slate-500">
                      {i.island_name}: {i.completed ? "✅" : `nivel ${i.current_level}/${i.total_levels}`} ★{i.stars}
                    </span>
                  ))}
                  {!(sub.islands || []).length && <span className="ml-2 text-slate-400">sin jugar</span>}
                </div>
              ))}
            </div>
          )},
          { key: "x", label: "", render: (s) => (
            <Button size="sm" variant="ghost" onClick={() => openReport(s.student_id)}><Printer className="w-3.5 h-3.5" /> Reporte</Button>
          )},
        ]}
        rows={data.students}
      />
      <Modal open={Boolean(report)} onClose={() => setReport(null)} title={`Reporte — ${report?.student?.username || ""}`} wide>
        {report && <PrintableReport report={report} />}
      </Modal>
    </div>
  );
}

function PrintableReport({ report }) {
  return (
    <div className="text-sm">
      <div className="mb-4 text-xs text-slate-500">
        {report.institution?.name} · {report.grade?.name} · Generado {new Date(report.generated_at).toLocaleDateString()}
      </div>
      {(report.student?.subjects || []).map((s) => (
        <div key={s.folder_id} className="mb-4">
          <h4 className="font-bold">{s.subject}</h4>
          <table className="w-full mt-1 text-xs">
            <thead><tr className="text-left text-slate-500"><th>Isla</th><th>Nivel</th><th>Estrellas</th><th>XP</th><th>Estado</th></tr></thead>
            <tbody>
              {(s.islands || []).map((i) => (
                <tr key={i.island_id} className="border-t border-slate-100">
                  <td className="py-1">{i.island_name}</td>
                  <td>{i.current_level}/{i.total_levels}</td>
                  <td>★ {i.stars}</td>
                  <td>{i.xp}</td>
                  <td>{i.completed ? "Completada" : "En curso"}</td>
                </tr>
              ))}
              {!(s.islands || []).length && <tr><td colSpan={5} className="py-2 text-slate-400">Sin actividad</td></tr>}
            </tbody>
          </table>
        </div>
      ))}
      <Button className="w-full no-print mt-2" onClick={() => window.print()}>Imprimir / PDF</Button>
    </div>
  );
}

/* ── Asignaciones ──────────────────────────────────────── */

function AssignTab({ gradeId }) {
  const [folders, setFolders] = useState([]);
  const [form, setForm] = useState({ folder_id: "", island_id: "", title: "", due_date: "" });
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    apiFetch(`/api/v1/institutions/grades/${gradeId}/folders`)
      .then((d) => setFolders(d.folders)).catch((e) => setError(e.message));
  }, [gradeId]);

  const folder = folders.find((f) => f.id === form.folder_id);
  const submit = async (e) => {
    e.preventDefault();
    setError(null); setOk(false);
    try {
      await apiFetch(`/api/v1/institutions/grades/${gradeId}/assign`, {
        method: "POST",
        body: { ...form, island_id: form.island_id || null, due_date: form.due_date || null },
      });
      setOk(true);
      setForm({ folder_id: "", island_id: "", title: "", due_date: "" });
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="max-w-md">
      <ErrorBox error={error} />
      {ok && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3 mb-4">Asignación creada — el badge 📌 aparece a los estudiantes.</div>}
      <form onSubmit={submit} className="space-y-4 bg-white rounded-xl border border-slate-200 p-5">
        <Select label="Materia" value={form.folder_id} onChange={(e) => setForm({ ...form, folder_id: e.target.value, island_id: "" })} required>
          <option value="">— elegir —</option>
          {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </Select>
        <Select label="Isla/tema (opcional — toda la materia si vacío)" value={form.island_id} onChange={(e) => setForm({ ...form, island_id: e.target.value })}>
          <option value="">Toda la materia</option>
          {(folder?.islands || []).map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </Select>
        <Input label="Título" placeholder="Repasar para el viernes" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input label="Fecha objetivo (opcional)" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
        <Button type="submit" className="w-full">Asignar 📌</Button>
      </form>
    </div>
  );
}

/* ── Ajustes del grado ─────────────────────────────────── */

function SettingsTab({ grade, gradeId, isAdmin }) {
  const refresh = useSchoolStore((s) => s.refresh);
  const [name, setName] = useState(grade?.name || "");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const rename = async (e) => {
    e.preventDefault();
    try { await apiFetch(`/api/v1/institutions/grades/${gradeId}`, { method: "PATCH", body: { name } }); await refresh(); }
    catch (err) { setError(err.message); }
  };
  const rotate = async () => {
    try { await apiFetch(`/api/v1/institutions/grades/${gradeId}/regenerate-code`, { method: "POST" }); await refresh(); }
    catch (err) { setError(err.message); }
  };
  const del = async (deleteFolders) => {
    const msg = deleteFolders ? "¿Eliminar el grado Y TODAS sus materias?" : "¿Eliminar el grado? Las materias pasan a ser personales del docente.";
    if (!confirm(msg)) return;
    try { await apiFetch(`/api/v1/institutions/grades/${gradeId}?delete_folders=${deleteFolders}`, { method: "DELETE" }); await refresh(); navigate("/grados"); }
    catch (err) { setError(err.message); }
  };

  return (
    <div className="max-w-md space-y-6">
      <ErrorBox error={error} />
      <form onSubmit={rename} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <Input label="Nombre del grado" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" size="sm">Guardar</Button>
      </form>
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-bold mb-1">Código de unión</h3>
        <p className="text-xs text-slate-500 mb-3">Rotar invalida el código anterior al instante.</p>
        <Button size="sm" variant="secondary" onClick={rotate}><RefreshCw className="w-3.5 h-3.5" /> Rotar código</Button>
      </div>
      {isAdmin && (
        <div className="bg-rose-50 rounded-xl border border-rose-200 p-5">
          <h3 className="text-sm font-bold text-rose-800 mb-1">Zona peligrosa</h3>
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="danger" onClick={() => del(false)}>Eliminar grado</Button>
            <Button size="sm" variant="danger" onClick={() => del(true)}>Eliminar con materias</Button>
          </div>
        </div>
      )}
    </div>
  );
}
