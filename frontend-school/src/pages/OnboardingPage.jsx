import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { School, KeyRound, Shield } from "lucide-react";
import { apiFetch } from "../lib/api";
import { useSchoolStore } from "../store/schoolStore";
import { useAuthStore } from "../store/authStore";
import { Button, Input, Select, ErrorBox } from "../components/ui";

/**
 * El usuario autenticado aún no pertenece a una institución.
 * - Director: crea su institución.
 * - Docente: se une con código PROF-XXXXX.
 * - Superadmin: selecciona una institución existente y se vincula como admin
 *   (soporte/impersonación — usa el endpoint admin de la plataforma).
 */
export default function OnboardingPage() {
  const user = useAuthStore((s) => s.user);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [insts, setInsts] = useState([]);
  const [instId, setInstId] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const refresh = useSchoolStore((s) => s.refresh);
  const navigate = useNavigate();

  const isSuperadmin = user?.role === "superadmin";

  useEffect(() => {
    if (!isSuperadmin) return;
    apiFetch("/api/v1/admin/institutions?limit=200")
      .then((d) => setInsts(d.institutions || []))
      .catch(() => {});
  }, [isSuperadmin]);

  const create = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/v1/institutions", { method: "POST", body: { name } });
      await refresh();
      navigate("/panel");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const join = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/v1/institutions/join", { method: "POST", body: { code } });
      await refresh();
      navigate("/panel");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const claim = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch(`/api/v1/admin/institutions/${instId}/admins`, {
        method: "POST",
        body: { user_id: user.id },
      });
      await refresh();
      navigate("/panel");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-900 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <School className="w-9 h-9 text-brand-600" />
          <h1 className="font-bold text-lg">Conecta con tu institución</h1>
        </div>
        <ErrorBox error={error} />

        {isSuperadmin ? (
          <form onSubmit={claim} className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Shield className="w-4 h-4 text-brand-600" />
              Acceso superadmin — selecciona una institución
            </div>
            <Select
              label="Institución"
              value={instId}
              onChange={(e) => setInstId(e.target.value)}
              required
            >
              <option value="">— elegir colegio —</option>
              {insts.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} · {i.students_enrolled} alumnos · {i.subscription?.status || "sin licencia"}
                </option>
              ))}
            </Select>
            <p className="text-xs text-slate-500">
              Te vinculas como administrador de la institución (queda auditado) y entras
              a gestionarla desde este panel.
            </p>
            <Button type="submit" loading={loading} disabled={!instId} className="w-full">
              Entrar como admin
            </Button>
          </form>
        ) : (
          <>
            <form onSubmit={create} className="space-y-3 pb-5 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-700">
                Soy director/a — crear mi institución
              </h2>
              <Input
                label="Nombre del colegio"
                placeholder="Colegio San Andrés"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Button type="submit" loading={loading} className="w-full">
                Crear institución
              </Button>
            </form>

            <form onSubmit={join} className="space-y-3 pt-5">
              <h2 className="text-sm font-semibold text-slate-700">
                <KeyRound className="w-4 h-4 inline mr-1" />
                Soy docente — tengo un código
              </h2>
              <Input
                label="Código de docente (PROF-XXXXX)"
                placeholder="PROF-AB1C2"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
              <Button type="submit" variant="secondary" loading={loading} className="w-full">
                Unirme como docente
              </Button>
            </form>
          </>
        )}

        <div className="mt-6 pt-4 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-500 mb-2">
            ¿Tu colegio ya existe? Entra directo con tu credencial (HUB-XXXXXXXX).
          </p>
          <button
            type="button"
            onClick={() => useAuthStore.getState().logout()}
            className="text-xs text-brand-700 hover:underline cursor-pointer"
          >
            ← Volver al login
          </button>
        </div>
      </div>
    </div>
  );
}
