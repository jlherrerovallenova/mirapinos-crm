// src/layouts/MainLayout.tsx
import React, { useState } from 'react';
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
  X,
  Loader2
} from 'lucide-react';

export default function MainLayout() {
  const { session, loading, signOut } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 1. PANTALLA DE CARGA
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

  // 2. PROTECCIÓN
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // 3. APP PRINCIPAL
  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      
      {/* OVERLAY PARA MÓVIL: Se muestra cuando el menú está abierto en pantallas pequeñas */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl 
        transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-6 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center text-white font-bold mr-3 shadow-lg shadow-emerald-900/20">
              M
            </div>
            <span className="text-white font-display font-bold text-lg tracking-tight">Mirapinos</span>
          </div>
          {/* Botón para cerrar en móvil */}
          <button onClick={closeSidebar} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2">Principal</p>
          <SidebarItem to="/" icon={<LayoutDashboard size={18} />} label="Panel de Control" active={location.pathname === '/'} onClick={closeSidebar} />
          <SidebarItem to="/leads" icon={<Users size={18} />} label="Clientes" active={location.pathname.startsWith('/leads')} onClick={closeSidebar} />
          <SidebarItem to="/pipeline" icon={<Calendar size={18} />} label="Ventas" active={location.pathname === '/pipeline'} onClick={closeSidebar} />
          
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Gestión</p>
          <SidebarItem to="/inventory" icon={<Map size={18} />} label="Inventario" active={location.pathname === '/inventory'} onClick={closeSidebar} />
          <SidebarItem to="/settings" icon={<Settings size={18} />} label="Configuración" active={location.pathname === '/settings'} onClick={closeSidebar} />
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
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shadow-sm z-10 flex-shrink-0">
          <div className="flex items-center gap-4">
             {/* Botón Hamburguesa para abrir el menú */}
             <button 
               onClick={toggleSidebar} 
               className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
             >
               <Menu size={24}/>
             </button>
             <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight truncate">
               {location.pathname === '/' ? 'Resumen General' : 
                location.pathname.includes('leads') ? 'Gestión de Clientes' : 
                location.pathname.includes('pipeline') ? 'Túnel de Ventas' :
                'Panel de Administración'}
             </h2>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all w-48 lg:w-64 placeholder:text-slate-400 font-medium"
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
        <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-100/50">
          <div className="max-w-7xl mx-auto pb-10">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

// Componente auxiliar para items del menú
interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: () => void;
}

function SidebarItem({ to, icon, label, active, onClick }: SidebarItemProps) {
  return (
    <Link 
      to={to}
      onClick={onClick}
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