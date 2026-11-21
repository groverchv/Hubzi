import { useEffect, useState } from "react";
import { CreditCard, Armchair } from "lucide-react";
import { apiFetch } from "../lib/api";
import { useSchoolStore } from "../store/schoolStore";
import { Button, Stat, Badge, ErrorBox, PageLoader, Input, Select } from "../components/ui";

export default function LicenciaPage() {
  const institution = useSchoolStore((s) => s.institution);
  const [ov, setOv] = useState(null);
  const [seats, setSeats] = useState("50");
  const [period, setPeriod] = useState("yearly");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch(`/api/v1/institutions/${institution.id}/overview`).then(setOv).catch((e) => setError(e.message));
  }, [institution?.id]);

  const checkout = async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await apiFetch(`/api/v1/institutions/${institution.id}/checkout`, {
        method: "POST",
        body: { seats: parseInt(seats, 10), period },
      });
      if (d?.checkout_url) window.location.href = d.checkout_url;
      else setError(d?.error || "Stripe no configurado — contacta a soporte.");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!ov) return <PageLoader />;
  const sub = institution.subscription || {};
  const est = period === "yearly" ? parseInt(seats, 10) * 3 : Math.ceil((parseInt(seats, 10) * 36) / 12);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Licencia y seats</h1>
      <ErrorBox error={error} />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat label="Seats licencia" value={ov.seat_limit} icon={Armchair} />
        <Stat label="Ocupados" value={ov.students_enrolled} />
        <Stat label="Estado" value={
          <Badge tone={sub.status === "active" ? "green" : "amber"}>{sub.status || "trial"}</Badge>
        } />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="w-5 h-5 text-brand-600" />
          <h2 className="font-bold">Ampliar licencia</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">USD $36 por estudiante al año (≈$3/mes). El pago es seguro vía Stripe.</p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Input label="Estudiantes" type="number" min={ov.students_enrolled || 1} value={seats} onChange={(e) => setSeats(e.target.value)} />
          <Select label="Periodo" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="yearly">Anual</option>
            <option value="monthly">Mensual</option>
          </Select>
        </div>
        <div className="flex items-center justify-between text-sm mb-4 bg-slate-50 rounded-lg px-4 py-3">
          <span className="text-slate-500">Estimado</span>
          <span className="font-bold text-lg">~${est.toLocaleString()} USD/{period === "yearly" ? "año" : "mes"}</span>
        </div>
        <Button className="w-full" loading={loading} onClick={checkout}>
          Pagar con Stripe →
        </Button>
      </div>
    </div>
  );
}
