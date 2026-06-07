// src/App.tsx
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';
import MainLayout from './layouts/MainLayout';
import ClientLayout from './layouts/ClientLayout';
import Login from './pages/Login';

// Importaciones perezosas
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Leads = lazy(() => import('./pages/Leads'));
const LeadDetail = lazy(() => import('./pages/LeadDetail'));
const Pipeline = lazy(() => import('./pages/Pipeline'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Agenda = lazy(() => import('./pages/Agenda'));
const Settings = lazy(() => import('./pages/Settings'));
const Newsletters = lazy(() => import('./pages/Newsletters'));
const NewsletterEditor = lazy(() => import('./pages/NewsletterEditor'));
const Stats = lazy(() => import('./pages/Stats'));
const Sales = lazy(() => import('./pages/Sales'));
const ClientPortal = lazy(() => import('./pages/ClientPortal'));

const PageLoader = () => (
  <div className="w-full h-[60vh] flex flex-col items-center justify-center">
    <Loader2 className="h-10 w-10 text-emerald-600 animate-spin mb-4" />
    <p className="text-slate-400 text-sm font-medium animate-pulse">Cargando módulo...</p>
  </div>
);

const ProtectedRoute = () => {
  const { session, profile, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  
  // Si es cliente, no puede entrar al CRM principal
  if (profile?.role === 'client') {
    return <Navigate to="/client-portal" replace />;
  }
  
  return <Outlet />;
};

const ClientRoute = () => {
  const { session, profile, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  
  // Si no es cliente, no puede entrar al portal de clientes
  if (profile && profile.role !== 'client') {
    return <Navigate to="/" replace />;
  }
  
  return <Outlet />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
          <Route path="/leads" element={<Suspense fallback={<PageLoader />}><Leads /></Suspense>} />
          <Route path="/leads/:id" element={<Suspense fallback={<PageLoader />}><LeadDetail /></Suspense>} />
          <Route path="/pipeline" element={<Suspense fallback={<PageLoader />}><Pipeline /></Suspense>} />
          <Route path="/inventory" element={<Suspense fallback={<PageLoader />}><Inventory /></Suspense>} />
          <Route path="/agenda" element={<Suspense fallback={<PageLoader />}><Agenda /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
          <Route path="/newsletters" element={<Suspense fallback={<PageLoader />}><Newsletters /></Suspense>} />
          <Route path="/newsletters/:id" element={<Suspense fallback={<PageLoader />}><NewsletterEditor /></Suspense>} />
          <Route path="/stats" element={<Suspense fallback={<PageLoader />}><Stats /></Suspense>} />
          <Route path="/sales" element={<Suspense fallback={<PageLoader />}><Sales /></Suspense>} />
        </Route>
      </Route>

      <Route element={<ClientRoute />}>
        <Route element={<ClientLayout />}>
          <Route path="/client-portal" element={<Suspense fallback={<PageLoader />}><ClientPortal /></Suspense>} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;