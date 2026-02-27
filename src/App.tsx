// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Pipeline from './pages/Pipeline';
import Inventory from './pages/Inventory';
import Agenda from './pages/Agenda';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { Loader2 } from 'lucide-react';

// Componente para proteger rutas que requieren autenticación
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Si está cargando la sesión, mostramos un spinner para evitar peticiones fallidas
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  // Si no hay usuario tras cargar, redirigimos al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Ruta pública de login */}
          <Route path="/login" element={<Login />} />

          {/* Rutas privadas envueltas en el layout y la protección */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="leads" element={<Leads />} />
            <Route path="leads/:id" element={<LeadDetail />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}