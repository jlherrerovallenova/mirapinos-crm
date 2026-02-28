// src/App.tsx
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';

// Importaciones perezosas (Lazy Loading) - Divide el código de cada "Sala"
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Leads = lazy(() => import('./pages/Leads'));
const LeadDetail = lazy(() => import('./pages/LeadDetail'));
const Pipeline = lazy(() => import('./pages/Pipeline'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Agenda = lazy(() => import('./pages/Agenda'));
const Settings = lazy(() => import('./pages/Settings'));

/**
 * Componente de Transición (Sala de espera)
 * Se muestra brevemente mientras el navegador descarga el código de la vista solicitada.
 */
const PageLoader = () => (
  <div className="w-full h-[60vh] flex flex-col items-center justify-center">
    <Loader2 className="h-10 w-10 text-emerald-600 animate-spin mb-4" />
    <p className="text-slate-400 text-sm font-medium animate-pulse">Cargando módulo...</p>
  </div>
);

/**
 * Componente de Ruta Protegida
 * Bloquea el acceso a las rutas internas si no hay una sesión activa en Supabase.
 */
const ProtectedRoute = () => {
  const { session, loading } = useAuth();

  // Mientras se verifica la conexión con la base de datos, no renderizamos nada
  if (loading) {
    return null;
  }

  // Si tras la carga no hay sesión, redirigimos al login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Si hay sesión, permitimos el paso a las rutas hijas
  return <Outlet />;
};

function App() {
  return (
    <Routes>
      {/* 1. Rutas Públicas (Carga Eager = Inmediata, no perezosa) */}
      <Route path="/login" element={<Login />} />

      {/* 2. Filtro de Seguridad (Rutas Protegidas) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* Todas las rutas hijas son cargadas perezosamente, usamos Suspense para gestionarlo */}
          <Route path="/" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
          <Route path="/leads" element={<Suspense fallback={<PageLoader />}><Leads /></Suspense>} />
          <Route path="/leads/:id" element={<Suspense fallback={<PageLoader />}><LeadDetail /></Suspense>} />
          <Route path="/pipeline" element={<Suspense fallback={<PageLoader />}><Pipeline /></Suspense>} />
          <Route path="/inventory" element={<Suspense fallback={<PageLoader />}><Inventory /></Suspense>} />
          <Route path="/agenda" element={<Suspense fallback={<PageLoader />}><Agenda /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
        </Route>
      </Route>

      {/* 3. Manejo de errores 404 / Redirección por defecto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App; 