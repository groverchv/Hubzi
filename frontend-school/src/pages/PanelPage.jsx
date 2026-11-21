import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Users, BookOpen, Armchair, Activity } from "lucide-react";
import { apiFetch } from "../lib/api";
import { useSchoolStore } from "../store/schoolStore";
import { useAuthStore } from "../store/authStore";
import { Stat, Badge, ErrorBox, PageLoader } from "../components/ui";

export default function PanelPage() {
  const institution = useSchoolStore((s) => s.institution);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const [ov, setOv] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!institution?.id) return;
    apiFetch(`/api/v1/institutions/${institution.id}/overview`)
      .then(setOv)
      .catch((e) => setError(e.message));
  }, [institution?.id]);

  if (!institution) return <PageLoader />;

  const sub = institution.subscription || {};
  const seatPct = ov?.seat_limit
    ? Math.min(100, Math.round((ov.students_enrolled / ov.seat_limit) * 100))
    : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{institution.name}</h1>
          {isAdmin && (
            <div className="flex items-center gap-2 mt-1">
              <Badge tone={sub.status === "active" ? "green" : "amber"}>
                {sub.status === "active" ? `Licencia activa · ${sub.seats} seats` : "Trial (30 estudiantes)"}
              </Badge>
            </div>
          )}
        </div>
        <Link to="/grados">
          <button className="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 cursor-pointer">
            Ir a grados →
          </button>
        </Link>
      </div>

      <ErrorBox error={error} />

      {!ov ? (
        <PageLoader />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Stat label="Grados" value={ov.grades_count} icon={GraduationCap} />
            <Stat label="Materias" value={ov.subjects_count} icon={BookOpen} />
            <Stat label="Docentes" value={ov.teachers_count} icon={Users} />
            <Stat
              label="Estudiantes"
              value={ov.students_enrolled}
              hint={`de ${ov.seat_limit} seats`}
              icon={Armchair}
            />
            <Stat label="Activos 7d" value={ov.students_active_7d} icon={Activity} />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5" hidden={!isAdmin}>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold text-slate-700">Uso de la licencia</span>
              <span className="text-slate-500">
                {ov.students_enrolled} / {ov.seat_limit} estudiantes ({seatPct}%)
              </span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${seatPct >= 90 ? "bg-rose-500" : "bg-brand-500"}`}
                style={{ width: `${seatPct}%` }}
              />
            </div>
            {seatPct >= 80 && (
              <p className="text-xs text-amber-700 mt-2">
                Estás cerca del límite — amplía la licencia en{" "}
                <Link to="/licencia" className="underline font-semibold">
                  Licencia
                </Link>
                .
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
