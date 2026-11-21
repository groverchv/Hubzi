import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { ShieldCheck } from "lucide-react";
import { apiFetch } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Button, Input, ErrorBox, CopyButton } from "../components/ui";

/**
 * Enrolamiento MFA obligatorio: docentes/admins manejan datos de menores —
 * el backend bloquea la API (403 mfa_enrollment_required) hasta activarlo.
 */
export default function MfaSetupPage() {
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState("");
  const [backup, setBackup] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch("/api/v1/auth/mfa/setup", { method: "POST" })
      .then((data) => {
        if (data?.status === "already_enabled") {
          navigate("/");
          return;
        }
        setSetup(data);
      })
      .catch((e) => setError(e.message));
  }, [navigate]);

  useEffect(() => {
    if (setup?.otpauth_uri && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, setup.otpauth_uri, { width: 180 }).catch(() => {});
    }
  }, [setup]);

  const enable = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch("/api/v1/auth/mfa/enable", {
        method: "POST",
        body: { code },
      });
      setBackup(data.backup_codes || []);
      setUser(useAuthStore.getState().user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-900 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="w-8 h-8 text-brand-600" />
          <h1 className="font-bold text-lg">Verificación en dos pasos (obligatoria)</h1>
        </div>
        <ErrorBox error={error} />
        {backup ? (
          <div>
            <p className="text-sm text-slate-600 mb-3">
              MFA activado. Guarda estos <strong>códigos de respaldo</strong> — se
              muestran una sola vez y cada uno sirve para entrar una vez si
              pierdes tu dispositivo:
            </p>
            <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-slate-50 rounded-lg p-4 mb-4">
              {backup.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
            <Button className="w-full" onClick={() => navigate("/")}>
              Continuar al panel
            </Button>
          </div>
        ) : setup ? (
          <form onSubmit={enable} className="space-y-4">
            <p className="text-sm text-slate-600">
              Gestiona datos de estudiantes — tu institución exige MFA. Escanea el
              código con Google Authenticator, Authy o similar:
            </p>
            <div className="flex justify-center">
              <canvas ref={canvasRef} />
            </div>
            <div className="text-center text-xs text-slate-500">
              ¿No puedes escanear? Clave manual:{" "}
              <code className="font-mono bg-slate-100 px-1 rounded">{setup.secret}</code>{" "}
              <CopyButton text={setup.secret} />
            </div>
            <Input
              label="Código de 6 dígitos"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              required
            />
            <Button type="submit" loading={loading} className="w-full">
              Activar MFA
            </Button>
          </form>
        ) : (
          <p className="text-sm text-slate-500">Generando secreto…</p>
        )}
      </div>
    </div>
  );
}
