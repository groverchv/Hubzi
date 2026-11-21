import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useSchoolStore } from "../store/schoolStore";
import { useAuthStore } from "../store/authStore";
import { Button, Input, ErrorBox, Modal, CopyButton } from "../components/ui";

export default function AjustesPage() {
  const institution = useSchoolStore((s) => s.institution);
  const myCredential = useSchoolStore((s) => s.myCredential);
  const refresh = useSchoolStore((s) => s.refresh);
  const reset = useSchoolStore((s) => s.reset);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [name, setName] = useState(institution?.name || "");
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const rename = async (e) => {
    e.preventDefault();
    setError(null); setOk(false);
    try {
      await apiFetch(`/api/v1/institutions/${institution.id}`, { method: "PATCH", body: { name } });
      await refresh();
      setOk(true);
    } catch (err) { setError(err.message); }
  };

  const destroy = async () => {
    if (confirmText !== institution.name) {
      setError(`Escribe exactamente "${institution.name}" para confirmar.`);
      return;
    }
    try {
      await apiFetch(`/api/v1/institutions/${institution.id}`, { method: "DELETE" });
      reset();
      navigate("/");
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Ajustes de la institución</h1>
      <ErrorBox error={error} />
      {ok && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3 mb-4">Guardado.</div>}

      <form onSubmit={rename} className="bg-white rounded-xl border border-slate-200 p-5 mb-6 space-y-4">
        <Input label="Nombre de la institución" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" size="sm">Guardar</Button>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 text-sm text-slate-600 space-y-1">
        <div><span className="font-semibold">ID:</span> <code className="text-xs">{institution?.id}</code></div>
        <div><span className="font-semibold">Tu rol:</span> {user?.role === "admin" ? "Director/Admin" : "Docente"}</div>
        <div className="flex items-center gap-1">
          <span className="font-semibold">Tu credencial:</span>
          <code className="text-xs">{myCredential || "—"}</code>
          {myCredential && <CopyButton text={myCredential} />}
        </div>
        <p className="text-[11px] text-slate-400">Con ella + el nombre del colegio entras en la pantalla de login (tab "Mi colegio").</p>
      </div>

      <div className="bg-rose-50 rounded-xl border border-rose-200 p-5">
        <h3 className="text-sm font-bold text-rose-800">Eliminar institución</h3>
        <p className="text-xs text-rose-700 mt-1 mb-3">
          Borra todos los grados, matrículas y materias escolares. Las cuentas de
          los estudiantes quedan desligadas (no se eliminan sus cuentas).
        </p>
        <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>Eliminar institución…</Button>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirmar eliminación">
        <p className="text-sm text-slate-600 mb-3">Escribe <strong>{institution?.name}</strong> para confirmar:</p>
        <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
        <div className="flex gap-2 mt-4 justify-end">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button variant="danger" onClick={destroy}>Eliminar definitivamente</Button>
        </div>
      </Modal>
    </div>
  );
}
