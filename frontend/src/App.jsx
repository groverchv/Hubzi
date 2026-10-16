import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AnimatedCloudsBackground from './components/AnimatedCloudsBackground';
import { CrisisProvider } from './lib/crisis.jsx';
import { useAuthStore } from './store/authStore';

// Code-splitting: las páginas pesadas se cargan bajo demanda por ruta
const ArcadeArena = lazy(() => import('./pages/ArcadeArena'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ZenPage = lazy(() => import('./pages/ZenPage'));

function RouteFallback() {
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-[#0a162b]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-[#FFB400] font-mono text-xs font-black uppercase tracking-widest">
          Hubzi cargando…
        </span>
      </div>
    </div>
  );
}

function RequireUser({ children }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/arena" replace />;
  return children;
}

function App() {
  return (
    <CrisisProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/arena"
              element={
                <div className="w-screen h-screen overflow-hidden relative">
                  <AnimatedCloudsBackground />
                  <ArcadeArena />
                </div>
              }
            />
            <Route
              path="/app"
              element={
                <RequireUser>
                  <DashboardPage />
                </RequireUser>
              }
            />
            <Route path="/zen" element={<ZenPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </CrisisProvider>
  );
}

export default App;
