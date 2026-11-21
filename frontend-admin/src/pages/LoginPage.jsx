import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { apiFetch } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Button, Input, ErrorBox } from "../components/ui";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mfa, setMfa] = useState(null);
  const [code, setCode] = useState("");
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();

  const finish = (data) => {
    setUser(data.user);
    navigate("/");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch("/api/v1/auth/login", { method: "POST", body: form });
      if (data?.mfa_required) { setMfa(data.mfa_token); return; }
      finish(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const submitMfa = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch("/api/v1/auth/mfa/verify", {
        method: "POST", body: { mfa_token: mfa, code },
      });
      finish(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-9 h-9 text-brand-600" />
          <div>
            <h1 className="font-bold text-lg leading-tight">Hubzy Admin</h1>
            <p className="text-xs text-slate-500">Consola de plataforma</p>
          </div>
        </div>
        <ErrorBox error={error} />
        {mfa ? (
          <form onSubmit={submitMfa} className="space-y-4">
            <p className="text-sm text-slate-600">Código de verificación:</p>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" autoFocus required />
            <Button type="submit" loading={loading} className="w-full">Verificar</Button>
          </form>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Input label="Correo" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Input label="Contraseña" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <Button type="submit" loading={loading} className="w-full">Entrar</Button>
          </form>
        )}
        <p className="text-[11px] text-slate-400 mt-6 text-center">Acceso restringido a superadmins. Todo queda auditado.</p>
      </div>
    </div>
  );
}
