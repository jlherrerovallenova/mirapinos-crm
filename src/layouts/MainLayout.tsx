// src/layouts/MainLayout.tsx
import React from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Map, 
  Settings, 
  Search, 
  Bell,
  LogOut,
  Menu,
  Loader2
} from 'lucide-react';

export default function MainLayout() {
  const { session, loading, signOut } = useAuth(); // Usamos el contexto de autenticación
  const location = useLocation();

  // 1. PANTALLA DE CARGA: Mientras Supabase comprueba quién eres
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-emerald-600 h-10 w-10" />
          <p className="text-slate-400 text-sm animate-pulse">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  // 2. PROTECCIÓN: Si no hay usuario, mandar al Login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // 3. APP PRINCIPAL: Si estás logueado, mostrar todo el diseño
  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-20 flex-shrink-0">
        
        {/* Logo Section */}
        <div className="h-16 flex items-center px-6 bg-slate-950 border-b border-slate-800">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center text-white font-bold mr-3 shadow-lg shadow-emerald-900/20">
            M
          </div>
          <span className="text-white font-display font-bold text-lg tracking-tight">Mirapinos</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2">Principal</p>
          <SidebarItem to="/" icon={<LayoutDashboard size={18} />} label="Panel de Control" active={location.pathname === '/'} />
          <SidebarItem to="/leads" icon={<Users size={18} />} label="Clientes" active={location.pathname.startsWith('/leads')} />
          <SidebarItem to="/pipeline" icon={<Calendar size={18} />} label="Ventas" active={location.pathname === '/pipeline'} />
          
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Gestión</p>
          <SidebarItem to="/inventory" icon={<Map size={18} />} label="Inventario" active={location.pathname === '/inventory'} />
          <SidebarItem to="/settings" icon={<Settings size={18} />} label="Configuración" active={location.pathname === '/settings'} />
        </nav>

        {/* User Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-xs shadow-md uppercase">
              {session.user.email?.substring(0, 2) || 'US'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">Usuario</p>
              <p className="text-xs text-slate-500 truncate">{session.user.email}</p>
            </div>
            <button 
              onClick={() => signOut()} 
              className="text-slate-500 hover:text-red-400 transition-colors" 
              title="Cerrar Sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10 flex-shrink-0">
          <div className="flex items-center gap-4">
             <button className="lg:hidden text-slate-500"><Menu size={24}/></button>
             <h2 className="text-xl font-bold text-slate-800 tracking-tight">
               {location.pathname === '/' ? 'Resumen General' : 
                location.pathname.includes('leads') ? 'Gestión de Clientes' : 
                location.pathname.includes('pipeline') ? 'Túnel de Ventas' :
                'Panel de Administración'}
             </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all w-64 placeholder:text-slate-400 font-medium"
              />
            </div>
            <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg relative transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
          </div>
        </header>

        {/* Área de Scroll */}
        <div className="flex-1 overflow-auto p-6 md:p-8 bg-slate-100/50">
          <div className="max-w-7xl mx-auto pb-10">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

// Componente auxiliar para items del menú
function SidebarItem({ to, icon, label, active }: { to: string, icon: React.ReactNode, label: string, active: boolean }) {
  return (
    <Link 
      to={to}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
        ${active 
          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }
      `}
    >
      <span className={active ? 'text-emerald-100' : 'text-slate-500 group-hover:text-white'}>{icon}</span>
      {label}
    </Link>
  );
}