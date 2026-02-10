// src/layouts/MainLayout.tsx
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Map, 
  Settings, 
  Search, 
  Bell,
  ChevronDown
} from 'lucide-react';

export default function MainLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* SIDEBAR - Altura completa, fijo y profesional */}
      <aside className="w-64 bg-pine-950 text-slate-300 flex flex-col flex-shrink-0 border-r border-pine-900 transition-all duration-300">
        
        {/* LOGO AREA */}
        <div className="h-16 flex items-center px-6 border-b border-pine-800/50 bg-pine-900/20">
          <div className="flex items-center gap-3">
             {/* Ajusta la ruta de tu logo si es necesario */}
            <div className="h-8 w-8 rounded-lg bg-pine-600 flex items-center justify-center text-white font-bold text-lg">
              M
            </div>
            <div>
              <h1 className="text-white font-display font-semibold tracking-tight leading-none">
                Mirapinos
              </h1>
              <span className="text-[10px] uppercase tracking-wider text-pine-400 font-semibold">
                CRM Suite
              </span>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-pine-500">
            Principal
          </div>
          <SidebarItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" active={location.pathname === '/'} />
          <SidebarItem to="/leads" icon={<Users size={20} />} label="Clientes" active={location.pathname.startsWith('/leads')} />
          <SidebarItem to="/pipeline" icon={<Calendar size={20} />} label="Ventas" active={location.pathname === '/pipeline'} />
          
          <div className="px-3 mt-8 mb-2 text-xs font-semibold uppercase tracking-wider text-pine-500">
            Gestión
          </div>
          <SidebarItem to="/inventory" icon={<Map size={20} />} label="Inventario" active={location.pathname === '/inventory'} />
        </nav>

        {/* USER / SETTINGS BOTTOM AREA */}
        <div className="p-4 border-t border-pine-800/50 bg-pine-900/10">
          <SidebarItem to="/settings" icon={<Settings size={20} />} label="Configuración" active={location.pathname === '/settings'} />
          
          <div className="mt-4 flex items-center gap-3 px-3 py-2 rounded-lg bg-pine-900/50 border border-pine-800/50">
            <div className="w-8 h-8 rounded-full bg-pine-700 flex items-center justify-center text-xs text-white font-bold">
              AM
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin</p>
              <p className="text-xs text-pine-400 truncate">admin@mirapinos.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50">
        
        {/* TOP HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          
          {/* Global Search */}
          <div className="flex-1 max-w-lg">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pine-600 transition-colors" size={18} />
              <input 
                type="text"
                className="w-full bg-slate-100/50 border border-transparent focus:bg-white focus:border-pine-200 focus:ring-4 focus:ring-pine-100 rounded-lg pl-10 pr-4 py-2 text-sm outline-none transition-all duration-200 placeholder:text-slate-400" 
                placeholder="Buscar clientes, propiedades o facturas..." 
              />
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-4 ml-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
              <span>Valladolid Office</span>
              <ChevronDown size={14} className="text-slate-400" />
            </div>
          </div>
        </header>

        {/* SCROLLABLE PAGE CONTENT */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

// Item del Sidebar optimizado
function SidebarItem({ to, icon, label, active }: { to: string, icon: React.ReactNode, label: string, active: boolean }) {
  return (
    <Link 
      to={to}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
        ${active 
          ? 'bg-pine-600 text-white shadow-sm' 
          : 'text-pine-100/70 hover:bg-pine-800/50 hover:text-white'
        }
      `}
    >
      <span className={`${active ? 'text-white' : 'text-pine-400 group-hover:text-white transition-colors'}`}>
        {icon}
      </span>
      {label}
    </Link>
  );
}