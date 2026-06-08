import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Loader2 } from 'lucide-react';

export default function ClientLayout() {
  const { session, profile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-emerald-600 h-10 w-10" />
      </div>
    );
  }

  if (!session || profile?.role !== 'client') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-12 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
            M
          </div>
          <div>
            <span className="text-slate-900 font-bold text-xl tracking-tight hidden sm:block">Mirapinos</span>
            <span className="text-emerald-600 font-medium text-sm hidden sm:block">Área de Cliente</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-slate-800">{profile.full_name || profile.email}</p>
            <p className="text-xs text-slate-500">Cliente</p>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8">
        <Outlet />
      </main>

      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-sm shrink-0 mt-auto">
        <p>© {new Date().getFullYear()} Mirapinos Residencial. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
