import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { Table, Badge, ErrorBox, PageLoader, Stat, fmtDate } from "../components/ui";

export default function SuscripcionesPage() {
  const [d, setD] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch("/api/v1/admin/subscriptions").then(setD).catch((e) => setError(e.message));
  }, []);

  if (!d) return <PageLoader />;

  const proUsers = d.pro_users || [];
  const licenses = d.school_licenses || [];
  const activeLicenses = licenses.filter((l) => l.subscription?.status === "active").length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Suscripciones</h1>
      <ErrorBox error={error} />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Stat label="Usuarios Pro" value={proUsers.length} />
        <Stat label="Licencias escolares" value={licenses.length} />
        <Stat label="Activas" value={activeLicenses} />
      </div>

      <h2 className="font-bold text-slate-900 mb-3">Licencias institucionales ({licenses.length})</h2>
      <div className="mb-8">
        <Table columns={[
          { key: "name", label: "Institución", render: (r) => (
            <Link to={`/instituciones/${r.institution_id}`} className="font-semibold text-brand-700 hover:underline">{r.name}</Link>
          )},
          { key: "status", label: "Estado", render: (r) => <Badge tone={{ active: "green", trialing: "amber", suspended: "red", canceled: "slate" }[r.subscription?.status] || "slate"}>{r.subscription?.status || "—"}</Badge> },
          { key: "seats", label: "Seats", render: (r) => r.subscription?.seats ?? "—" },
          { key: "activated", label: "Activada", render: (r) => fmtDate(r.subscription?.activated_at) },
        ]} rows={licenses} empty="Sin licencias" />
      </div>

      <h2 className="font-bold text-slate-900 mb-3">Usuarios Pro ({proUsers.length})</h2>
      <Table columns={[
        { key: "email", label: "Email", render: (r) => (
          <Link to={`/usuarios/${r.id}`} className="font-semibold text-brand-700 hover:underline">{r.email}</Link>
        )},
        { key: "username", label: "Nombre" },
        { key: "pro_since", label: "Pro desde", render: (r) => fmtDate(r.pro_since) },
        { key: "stripe_customer", label: "Stripe", render: (r) => r.stripe_customer ? "✓" : "—" },
      ]} rows={proUsers} empty="Sin usuarios Pro" />
    </div>
  );
}
