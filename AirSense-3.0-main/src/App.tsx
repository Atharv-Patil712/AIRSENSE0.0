import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { MapPage } from '@/pages/MapPage';
import { AqiPage } from '@/pages/AqiPage';
import { WeatherPage } from '@/pages/WeatherPage';
import { SourceAnalysisPage } from '@/pages/SourceAnalysisPage';
import { PredictionsPage } from '@/pages/PredictionsPage';
import { AlertsPage } from '@/pages/AlertsPage';
import { DataUploadPage } from '@/pages/DataUploadPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import type { ReactNode } from 'react';
import { lazy, Suspense } from 'react';

/**
 * The cinematic home page is lazy-loaded: Three.js and GSAP live in their own
 * chunks and are never downloaded by the dashboard routes.
 */
const ExperiencePage = lazy(() =>
  import('@/pages/ExperiencePage').then((module) => ({ default: module.ExperiencePage })),
);

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public: the cinematic experience is the product's front door. */}
      <Route
        path="/"
        element={
          <Suspense fallback={<FullPageLoader label="AirSense" />}>
            <ExperiencePage />
          </Suspense>
        }
      />
      {/* The conventional marketing / product overview page, unchanged. */}
      <Route path="/overview" element={<LandingPage />} />
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />
      <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/aqi" element={<AqiPage />} />
        <Route path="/weather" element={<WeatherPage />} />
        <Route path="/source-analysis" element={<SourceAnalysisPage />} />
        <Route path="/predictions" element={<PredictionsPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/data-upload" element={<DataUploadPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
