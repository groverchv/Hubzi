import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import LandingPage from './pages/LandingPage';
import AnimatedCloudsBackground from './components/AnimatedCloudsBackground';
import RotatePhoneOverlay from './components/RotatePhoneOverlay';
import { CrisisProvider } from './lib/crisis.jsx';
import { useAuthStore } from './store/authStore';
import { useLowPower } from './utils/lowPower';
import ErrorBoundary from './components/ErrorBoundary';

// Code-splitting: las páginas pesadas se cargan bajo demanda por ruta
const ArcadeArena = lazy(() => import('./pages/ArcadeArena'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ZenPage = lazy(() => import('./pages/ZenPage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));

function RouteFallback() {
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-[var(--color-arcade-navy-dark)]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-[var(--color-arcade-yellow)] font-mono text-xs font-black uppercase tracking-widest">
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
  const lowPower = useLowPower();
  return (
    <MotionConfig reducedMotion={lowPower ? 'always' : 'user'}>
    <CrisisProvider>
      <ErrorBoundary>
      <BrowserRouter>
        <RotatePhoneOverlay />
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
            <Route path="/legal/terminos" element={<LegalPage type="terminos" />} />
            <Route path="/legal/privacidad" element={<LegalPage type="privacidad" />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      </ErrorBoundary>
    </CrisisProvider>
    </MotionConfig>
  );
}

export default App;
