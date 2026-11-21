import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { useSchoolStore } from "./store/schoolStore";
import { ApiError } from "./lib/api";
import Layout from "./components/Layout";
import { PageLoader } from "./components/ui";
import LoginPage from "./pages/LoginPage";
import MfaSetupPage from "./pages/MfaSetupPage";
import OnboardingPage from "./pages/OnboardingPage";
import PanelPage from "./pages/PanelPage";
import GradosPage from "./pages/GradosPage";
import GradeDetailPage from "./pages/GradeDetailPage";
import DocentesPage from "./pages/DocentesPage";
import LicenciaPage from "./pages/LicenciaPage";
import AjustesPage from "./pages/AjustesPage";

/** Rutas solo para director/admin — un docente cae a su panel. */
function AdminOnly({ children }) {
  const role = useSchoolStore((s) => s.role) || useAuthStore.getState().user?.role;
  return role === "admin" ? children : <Navigate to="/panel" replace />;
}

export default function App() {
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const [booting, setBooting] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);

  // Bootstrap: revalidar sesión y cargar institución. Si el backend exige
  // enrolamiento MFA (staff), /institutions/mine responde 403.
  useEffect(() => {
    (async () => {
      await refreshUser();
      const u = useAuthStore.getState().user;
      if (u && ["admin", "teacher", "superadmin"].includes(u.role)) {
        try {
          await useSchoolStore.getState().refresh();
        } catch (e) {
          if (e instanceof ApiError && e.status === 403 && String(e.message).includes("mfa_enrollment_required")) {
            setMfaRequired(true);
          }
        }
      }
      setBooting(false);
    })();
  }, [refreshUser]);

  if (booting) return <PageLoader />;

  const isStaff = user && ["admin", "teacher", "superadmin"].includes(user.role);
  if (user && isStaff && mfaRequired && !user.mfa_enabled) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<MfaSetupPage />} />
        </Routes>
      </BrowserRouter>
    );
  }
  const hasInstitution = Boolean(useSchoolStore.getState().institution);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {!user || !isStaff ? (
          <Route path="*" element={<Navigate to="/login" replace />} />
        ) : !hasInstitution ? (
          <Route path="*" element={<OnboardingPage />} />
        ) : (
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/panel" replace />} />
            <Route path="/panel" element={<PanelPage />} />
            <Route path="/grados" element={<GradosPage />} />
            <Route path="/grados/:gradeId" element={<GradeDetailPage />} />
            {/* Solo director/admin */}
            <Route path="/docentes" element={<AdminOnly><DocentesPage /></AdminOnly>} />
            <Route path="/licencia" element={<AdminOnly><LicenciaPage /></AdminOnly>} />
            <Route path="/ajustes" element={<AdminOnly><AjustesPage /></AdminOnly>} />
            <Route path="*" element={<Navigate to="/panel" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}
