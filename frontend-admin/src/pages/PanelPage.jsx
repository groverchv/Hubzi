import { useEffect, useState } from "react";
import { Users, School, FolderOpen, AlertTriangle, Database, Boxes } from "lucide-react";
import { apiFetch } from "../lib/api";
import { Stat, Badge, ErrorBox, PageLoader } from "../components/ui";

export default function PanelPage() {
  const [ov, setOv] = useState(null);
  const [sys, setSys] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch("/api/v1/admin/overview").then(setOv).catch((e) => setError(e.message));
    apiFetch("/api/v1/admin/system").then(setSys).catch(() => {});
  }, []);

  if (!ov) return <PageLoader />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Panel de plataforma</h1>
      <ErrorBox error={error} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Usuarios" value={ov.users.total} hint={`+${ov.users.new_7d} esta semana · ${ov.users.active_7d} activos 7d`} icon={Users} />
        <Stat label="Instituciones" value={ov.institutions.total} hint={`${ov.institutions.licensed} con licencia`} icon={School} />
        <Stat label="Carpetas" value={ov.content.study_folders} hint={`${ov.content.grades} grados`} icon={FolderOpen} />
        <Stat label="Jobs fallidos" value={ov.jobs.failed} icon={AlertTriangle} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Usuarios Pro" value={ov.users.pro} />
        <Stat label="Inst. con licencia" value={ov.institutions.licensed} />
        <Stat label="Inst. suspendidas" value={ov.institutions.suspended} />
        <Stat label="Inst. trial/sin licencia" value={ov.institutions.trial_or_unlicensed} />
      </div>

      {sys ? (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Database className="w-4 h-4" /> Salud del sistema
            <span className="text-xs font-normal text-slate-400">env {sys.environment} · v{sys.version}</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Health label="MongoDB" ok={sys.databases?.mongodb === "connected"} />
            <Health label="Qdrant" ok={sys.databases?.qdrant === "connected"} />
            <Health label="Rate limit" ok={sys.flags?.rate_limit} />
            <Health label="MFA staff" ok={sys.flags?.mfa_enforce_institutions} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Integration name="Stripe" ok={sys.integrations?.stripe} />
            <Integration name="Gemini" ok={sys.integrations?.gemini} />
            <Integration name="Groq" ok={sys.integrations?.groq} />
            <Integration name="Sentry" ok={sys.integrations?.sentry} />
            <Integration name="Respan" ok={sys.integrations?.respan} />
            <Integration name="Email" ok={sys.flags?.email_enabled} />
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <Boxes className="w-4 h-4 inline mr-1" /> No se pudo cargar /admin/system.
        </div>
      )}
    </div>
  );
}

function Health({ label, ok }) {
  return (
    <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
      <span className="text-slate-600">{label}</span>
      <Badge tone={ok ? "green" : "red"}>{ok ? "OK" : "off"}</Badge>
    </div>
  );
}

function Integration({ name, ok }) {
  return <Badge tone={ok ? "green" : "slate"}>{name} {ok ? "✓" : "off"}</Badge>;
}
