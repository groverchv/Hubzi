import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Layout from "./components/Layout";
import { PageLoader } from "./components/ui";
import LoginPage from "./pages/LoginPage";
import PanelPage from "./pages/PanelPage";
import InstitucionesPage from "./pages/InstitucionesPage";
import InstitucionDetailPage from "./pages/InstitucionDetailPage";
import UsuariosPage from "./pages/UsuariosPage";
import UsuarioDetailPage from "./pages/UsuarioDetailPage";
import SuscripcionesPage from "./pages/SuscripcionesPage";
import SeguridadPage from "./pages/SeguridadPage";
import SistemaPage from "./pages/SistemaPage";
import SuperadminsPage from "./pages/SuperadminsPage";

export default function App() {
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      await refreshUser();
      setBooting(false);
    })();
  }, [refreshUser]);

  if (booting) return <PageLoader />;
  const isSuperadmin = user?.role === "superadmin";

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {!isSuperadmin ? (
          <Route path="*" element={<Navigate to="/login" replace />} />
        ) : (
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/panel" replace />} />
            <Route path="/panel" element={<PanelPage />} />
            <Route path="/instituciones" element={<InstitucionesPage />} />
            <Route path="/instituciones/:id" element={<InstitucionDetailPage />} />
            <Route path="/usuarios" element={<UsuariosPage />} />
            <Route path="/usuarios/:id" element={<UsuarioDetailPage />} />
            <Route path="/suscripciones" element={<SuscripcionesPage />} />
            <Route path="/seguridad" element={<SeguridadPage />} />
            <Route path="/sistema" element={<SistemaPage />} />
            <Route path="/superadmins" element={<SuperadminsPage />} />
            <Route path="*" element={<Navigate to="/panel" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}
