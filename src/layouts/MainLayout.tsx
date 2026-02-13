// src/layouts/MainLayout.tsx
import { Outlet, Navigate } from 'react-router-dom'; // Importar Navigate
import { useAuth } from '../context/AuthContext';
// ... resto de imports (Sidebar, Header, etc.)

export default function MainLayout() {
  const { session, loading } = useAuth(); // Usamos el contexto

  // 1. Si está cargando, mostramos spinner
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // 2. Si NO hay sesión, redirigir al Login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // 3. Si hay sesión, mostrar la app normal
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar, Header, etc. (tu código actual aquí) */}
      <Sidebar /> 
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
           <Outlet />
        </main>
      </div>
    </div>
  );
}