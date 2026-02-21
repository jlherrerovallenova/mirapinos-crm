// src/App.tsx
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Pipeline from './pages/Pipeline';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';
import LeadDetail from './pages/LeadDetail';
import Agenda from './pages/Agenda';
import Login from './pages/Login';

/**
 * Componente de Ruta Protegida
 * Bloquea el acceso a las rutas internas si no hay una sesión activa en Supabase.
 */
const ProtectedRoute = () => {
  const { session, loading } = useAuth();

  // Mientras se verifica la conexión con la base de datos, no renderizamos nada
  // para evitar parpadeos de contenido protegido.
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
      {/* 1. Rutas Públicas */}
      <Route path="/login" element={<Login />} />

      {/* 2. Filtro de Seguridad (Rutas Protegidas) */}
      <Route element={<ProtectedRoute />}>
        {/* Todas estas rutas requieren sesión y usan el layout con Sidebar/Header */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/leads/:id" element={<LeadDetail />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* 3. Manejo de errores 404 / Redirección por defecto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;