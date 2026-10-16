import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ArcadeArena from './pages/ArcadeArena';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import ZenPage from './pages/ZenPage';
import AnimatedCloudsBackground from './components/AnimatedCloudsBackground';
import { CrisisProvider } from './lib/crisis.jsx';
import { useAuthStore } from './store/authStore';

function RequireUser({ children }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/arena" replace />;
  return children;
}

function App() {
  return (
    <CrisisProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </CrisisProvider>
  );
}

export default App;
