import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { School } from "lucide-react";
import { apiFetch } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Button, Input, Select, ErrorBox } from "../components/ui";

export default function LoginPage() {
  const [tab, setTab] = useState("colegio"); // colegio | correo
  const [mode, setMode] = useState("login"); // login | register
  const [insts, setInsts] = useState([]);
  const [instId, setInstId] = useState("");
  const [dirState, setDirState] = useState("loading"); // loading | ok | error
  const [form, setForm] = useState({ email: "", password: "", username: "", age: "", credential: "" });
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
    navigate("/");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "register") {
        const data = await apiFetch("/api/v1/auth/register", {
          method: "POST",
          body: {
            email: form.email,
            password: form.password,
            username: form.username,
            gender: "otro",
            age: parseInt(form.age, 10) || 30,
            parental_consent: true,
          },
        });
        finish(data);
        return;
      }
      const data =
        tab === "colegio"
          ? await apiFetch("/api/v1/auth/school-login", {
              method: "POST",
              body: { institution_id: instId, credential: form.credential },
            })
          : await apiFetch("/api/v1/auth/login", {
              method: "POST",
              body: { email: form.email, password: form.password },
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
            {mode === "login" && (
              <div className="flex gap-1 mb-5 bg-slate-100 rounded-lg p-1">
                {[["colegio", "Mi colegio"], ["correo", "Correo"]].map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setTab(k)}
                    className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                      tab === k ? "bg-white shadow text-brand-700" : "text-slate-500"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              {mode === "register" && (
                <>
                  <Input
                    label="Nombre"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                  />
                  <Input
                    label="Edad"
                    type="number"
                    min="18"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    required
                  />
                </>
              )}
              {mode === "register" || tab === "correo" ? (
                <Input
                  label="Correo electrónico"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              ) : (
                <>
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
                </>
              )}
              {(mode === "register" || tab === "correo") && (
                <Input
                  label="Contraseña"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              )}
              <Button type="submit" loading={loading} className="w-full">
                {mode === "login" ? "Entrar" : "Crear cuenta"}
              </Button>
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="w-full text-center text-xs text-brand-700 hover:underline cursor-pointer"
              >
                {mode === "login"
                  ? "¿Eres director nuevo? Crea tu cuenta"
                  : "¿Ya tienes cuenta? Inicia sesión"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
