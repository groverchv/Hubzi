import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { Table, Badge, ErrorBox, PageLoader, Stat, fmtDate } from "../components/ui";

export default function SistemaPage() {
  const [sys, setSys] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);

  const loadJobs = useCallback(() => {
    // /admin/jobs solo acepta `limit` — devuelve los más recientes
    apiFetch("/api/v1/admin/jobs?limit=50")
      .then((d) => setJobs(d.jobs || []))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    apiFetch("/api/v1/admin/system").then(setSys).catch((e) => setError(e.message));
    loadJobs();
  }, [loadJobs]);

  if (!sys) return <PageLoader />;

  const flags = sys.flags || {};
  const integ = sys.integrations || {};
  const dbs = sys.databases || {};

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        Sistema <span className="text-sm font-normal text-slate-400">env {sys.environment} · v{sys.version}</span>
      </h1>
      <ErrorBox error={error} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="MongoDB" value={<Badge tone={dbs.mongodb === "connected" ? "green" : "red"}>{dbs.mongodb}</Badge>} />
        <Stat label="Qdrant" value={<Badge tone={dbs.qdrant === "connected" ? "green" : "amber"}>{dbs.qdrant}</Badge>} />
        <Stat label="Rate limit" value={<Badge tone={flags.rate_limit ? "green" : "slate"}>{flags.rate_limit ? "on" : "off"}</Badge>} />
        <Stat label="MFA staff" value={<Badge tone={flags.mfa_enforce_institutions ? "green" : "amber"}>{flags.mfa_enforce_institutions ? "obligatorio" : "opcional"}</Badge>} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h2 className="font-bold mb-3">Integraciones y flags</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries({ Stripe: integ.stripe, Gemini: integ.gemini, Groq: integ.groq, Sentry: integ.sentry, Respan: integ.respan, Email: flags.email_enabled, HIBP: flags.hibp, "Motores proc.": flags.procedural_engines, "Prewarm L1": flags.prewarm_level1 }).map(([name, ok]) => (
            <Badge key={name} tone={ok ? "green" : "slate"}>{name} {ok ? "✓" : "off"}</Badge>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold mb-3">Jobs de generación</h2>
        <Table columns={[
          { key: "created_at", label: "Fecha", render: (r) => fmtDate(r.created_at) },
          { key: "kind", label: "Tipo", render: (r) => r.kind || "—" },
          { key: "status", label: "Estado", render: (r) => <Badge tone={{ done: "green", completed: "green", error: "red", failed: "red", running: "amber", processing: "amber", pending: "amber" }[r.status] || "slate"}>{r.status}</Badge> },
          { key: "progress", label: "Progreso", render: (r) => r.progress != null ? `${r.progress}%` : "—" },
          { key: "user_id", label: "Usuario", render: (r) => <code className="text-xs text-slate-500">{(r.user_id || "—").slice(-6)}</code> },
          { key: "error", label: "Error", render: (r) => <span className="text-xs text-rose-600">{String(r.error || "").slice(0, 80)}</span> },
        ]} rows={jobs} empty="Sin jobs" />
        <p className="text-xs text-slate-400 mt-3">Últimos {jobs.length} jobs.</p>
      </div>
    </div>
  );
}
