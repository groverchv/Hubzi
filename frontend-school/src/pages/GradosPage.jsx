import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, RefreshCw } from "lucide-react";
import { apiFetch } from "../lib/api";
import { useSchoolStore } from "../store/schoolStore";
import { useAuthStore } from "../store/authStore";
import { Button, Input, Modal, Table, Badge, ErrorBox, CopyButton } from "../components/ui";

export default function GradosPage() {
  const grades = useSchoolStore((s) => s.grades);
  const refresh = useSchoolStore((s) => s.refresh);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const create = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch(`/api/v1/institutions/${useSchoolStore.getState().institution.id}/grades`, {
        method: "POST",
        body: { name },
      });
      setModal(false);
      setName("");
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const rotateCode = async (gradeId) => {
    try {
      await apiFetch(`/api/v1/institutions/grades/${gradeId}/regenerate-code`, {
        method: "POST",
      });
      await refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Grados y paralelos</h1>
        <Button onClick={() => setModal(true)}>
          <Plus className="w-4 h-4" /> Nuevo grado
        </Button>
      </div>

      <Table
        rowKey="id"
        empty="Aún no hay grados — crea el primero."
        columns={[
          { key: "name", label: "Grado" },
          {
            key: "join_code",
            label: "Código de unión",
            render: (g) => (
              <span className="flex items-center gap-2 font-mono text-xs">
                {g.join_code} <CopyButton text={g.join_code} />
              </span>
            ),
          },
          {
            key: "student_count",
            label: "Estudiantes",
            render: (g) => <Badge tone="blue">{g.student_count ?? (g.student_ids || []).length}</Badge>,
          },
          {
            key: "folder_ids",
            label: "Materias",
            render: (g) => (g.folder_ids || []).length,
          },
          {
            key: "actions",
            label: "",
            render: (g) => (
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="secondary" onClick={() => navigate(`/grados/${g.id}`)}>
                  Gestionar
                </Button>
                <Button size="sm" variant="ghost" title="Rotar código" onClick={() => rotateCode(g.id)}>
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </div>
            ),
          },
        ]}
        rows={grades}
      />

      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo grado">
        <form onSubmit={create} className="space-y-4">
          <ErrorBox error={error} />
          <Input
            label="Nombre del grado/paralelo"
            placeholder="5to Secundaria B"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <p className="text-xs text-slate-500">
            Se generará un código de unión (HUBZY-XXXXX) para matricular estudiantes.
          </p>
          <Button type="submit" loading={loading} className="w-full">
            Crear grado
          </Button>
        </form>
      </Modal>
      {isAdmin ? null : null}
    </div>
  );
}
