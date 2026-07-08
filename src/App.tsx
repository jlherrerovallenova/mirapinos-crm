// src/App.tsx
import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { formatClientName } from './utils/formatName';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';
import MainLayout from './layouts/MainLayout';
import ClientLayout from './layouts/ClientLayout';
import Login from './features/auth/pages/Login';

// Importaciones perezosas
const Dashboard = lazy(() => import('./features/dashboard/pages/Dashboard'));
const Leads = lazy(() => import('./features/leads/pages/Leads'));
const LeadDetail = lazy(() => import('./features/leads/pages/LeadDetail'));
const Pipeline = lazy(() => import('./features/dashboard/pages/Pipeline'));
const Inventory = lazy(() => import('./features/inventory/pages/Inventory'));
const Agenda = lazy(() => import('./features/agenda/pages/Agenda'));
const Settings = lazy(() => import('./features/settings/pages/Settings'));
const Newsletters = lazy(() => import('./features/newsletters/pages/Newsletters'));
const NewsletterEditor = lazy(() => import('./features/newsletters/pages/NewsletterEditor'));
const Stats = lazy(() => import('./features/dashboard/pages/Stats'));
const Sales = lazy(() => import('./features/sales/pages/Sales'));
const ClientPortal = lazy(() => import('./features/client-portal/pages/ClientPortal'));
const FeedbackResponse = lazy(() => import('./features/surveys/pages/FeedbackResponse'));
const SurveyResults = lazy(() => import('./features/surveys/pages/SurveyResults'));

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
  const { session } = useAuth();

  useEffect(() => {
    if (!session) return;
    const runNormalization = async () => {
      const alreadyRun = localStorage.getItem('names_normalized_20260707');
      if (alreadyRun === 'true') return;
      try {
        console.log('[Migration] Iniciando normalización de nombres...');
        const { data: leads, error } = await supabase.from('leads').select('id, name');
        if (error) throw error;
        if (!leads || leads.length === 0) {
          console.log('[Migration] No se encontraron leads.');
          localStorage.setItem('names_normalized_20260707', 'true');
          return;
        }
        let count = 0;
        for (const lead of leads) {
          if (!lead.name) continue;
          const formatted = formatClientName(lead.name);
          if (lead.name !== formatted) {
            console.log(`[Migration] Normalizando: "${lead.name}" -> "${formatted}"`);
            const { error: updateError } = await supabase.from('leads').update({ name: formatted }).eq('id', lead.id);
            if (!updateError) count++;
          }
        }
        console.log(`[Migration] Normalización completada. Se transformaron ${count} nombres.`);
        localStorage.setItem('names_normalized_20260707', 'true');
      } catch (err) {
        console.error('[Migration] Error:', err);
      }
    };
    runNormalization();
  }, [session]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/feedback" element={<Suspense fallback={<PageLoader />}><FeedbackResponse /></Suspense>} />
      
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
          <Route path="/surveys" element={<Suspense fallback={<PageLoader />}><SurveyResults /></Suspense>} />
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