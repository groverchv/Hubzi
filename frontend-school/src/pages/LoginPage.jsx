import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { School } from "lucide-react";
import { apiFetch } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Button, Input, Select, ErrorBox } from "../components/ui";

export default function LoginPage() {
  const [insts, setInsts] = useState([]);
  const [instId, setInstId] = useState("");
  const [dirState, setDirState] = useState("loading"); // loading | ok | error
  const [form, setForm] = useState({ credential: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mfa, setMfa] = useState(null);
  const [code, setCode] = useState("");
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();

  const loadDirectory = () => {
    setDirState("loading");
    apiFetch("/api/v1/institutions/directory")
      .then((d) => {
        setInsts(d.institutions || []);
        setDirState("ok");
      })
      .catch(() => setDirState("error"));
  };

  useEffect(loadDirectory, []);

  const finish = (data) => {
    setUser(data.user);
    // Recarga completa: el bootstrap de App.jsx vuelve a pedir /institutions/mine,
    // carga institución+rol y aplica el gate de enrolamiento MFA del staff.
    window.location.href = "/";
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch("/api/v1/auth/school-login", {
        method: "POST",
        body: { institution_id: instId, credential: form.credential },
      });
      if (data?.mfa_required) {
        setMfa(data.mfa_token);
        return;
      }
      finish(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitMfa = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch("/api/v1/auth/mfa/verify", {
        method: "POST",
        body: { mfa_token: mfa, code },
      });
      finish(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-900 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <School className="w-9 h-9 text-brand-600" />
          <div>
            <h1 className="font-bold text-lg leading-tight">Hubzy Escuelas</h1>
            <p className="text-xs text-slate-500">Panel para directores y docentes</p>
          </div>
        </div>

        <ErrorBox error={error} />

        {mfa ? (
          <form onSubmit={submitMfa} className="space-y-4">
            <p className="text-sm text-slate-600">
              Tu cuenta tiene verificación en dos pasos. Ingresa el código de tu
              app autenticadora (o un código de respaldo).
            </p>
            <Input
              label="Código de verificación"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              autoFocus
              required
            />
            <Button type="submit" loading={loading} className="w-full">
              Verificar
            </Button>
          </form>
        ) : (
          <>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Select
                  label="Mi colegio"
                  value={instId}
                  onChange={(e) => setInstId(e.target.value)}
                  disabled={dirState !== "ok"}
                  required
                >
                  <option value="">
                    {dirState === "loading"
                      ? "Cargando colegios…"
                      : "— selecciona tu institución —"}
                  </option>
                  {insts.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </Select>
                {dirState === "error" && (
                  <button
                    type="button"
                    onClick={loadDirectory}
                    className="mt-1 text-xs text-brand-700 hover:underline cursor-pointer"
                  >
                    No se pudo cargar la lista — reintentar
                  </button>
                )}
              </div>
              <Input
                label="Credencial"
                placeholder="HUB-XXXXXXXX"
                value={form.credential}
                onChange={(e) => setForm({ ...form, credential: e.target.value })}
                autoComplete="off"
                required
              />
              <p className="text-[11px] text-slate-500 -mt-2">
                Es el código que te entregó tu colegio (docentes: página
                Docentes · alumnos: la lista de tu grado).
              </p>
              <Button type="submit" loading={loading} className="w-full">
                Entrar
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
