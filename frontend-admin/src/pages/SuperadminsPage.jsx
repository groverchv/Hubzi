import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Button, Input, Table, Badge, ErrorBox, PageLoader, fmtDate } from "../components/ui";

export default function SuperadminsPage() {
  const [rows, setRows] = useState(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const me = useAuthStore((s) => s.user);

  const load = useCallback(() => {
    apiFetch("/api/v1/admin/superadmins").then((d) => setRows(d.superadmins)).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const promote = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("/api/v1/admin/superadmins", { method: "POST", body: { email } });
      setEmail("");
      load();
    } catch (err) { setError(err.message); }
  };

  const revoke = async (uid) => {
    if (!confirm("¿Revocar superadmin a este usuario?")) return;
    try { await apiFetch(`/api/v1/admin/superadmins/${uid}`, { method: "DELETE" }); load(); }
    catch (e) { setError(e.message); }
  };

  if (!rows) return <PageLoader />;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Superadmins</h1>
      <ErrorBox error={error} />
      <form onSubmit={promote} className="flex gap-2 mb-6">
        <Input placeholder="email a elevar a superadmin" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Button type="submit" size="sm">Elevar</Button>
      </form>
      <Table rowKey="id" columns={[
        { key: "email", label: "Email", render: (u) => <span className="font-semibold">{u.email}{u.id === me?.id && " (tú)"}</span> },
        { key: "username", label: "Nombre" },
        { key: "created_at", label: "Desde", render: (u) => fmtDate(u.created_at) },
        { key: "x", label: "", render: (u) => (
          u.id !== me?.id
            ? <Button size="sm" variant="ghost" onClick={() => revoke(u.id)}>Revocar</Button>
            : <Badge tone="slate">auto-protegido</Badge>
        )},
      ]} rows={rows} empty="Sin superadmins" />
    </div>
  );
}
