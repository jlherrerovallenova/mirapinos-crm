import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Map, 
  Settings, 
  Search, 
  Bell,
  LogOut
} from 'lucide-react';

export default function MainLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900">
      
      {/* SIDEBAR: Oscuro y de Alto Contraste */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-20">
        
        {/* Logo Section */}
        <div className="h-16 flex items-center px-6 bg-slate-950 border-b border-slate-800">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center text-white font-bold mr-3">
            M
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Mirapinos</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2">Principal</p>
          <SidebarItem to="/" icon={<LayoutDashboard size={20} />} label="Panel de Control" active={location.pathname === '/'} />
          <SidebarItem to="/leads" icon={<Users size={20} />} label="Clientes" active={location.pathname.startsWith('/leads')} />
          <SidebarItem to="/pipeline" icon={<Calendar size={20} />} label="Ventas" active={location.pathname === '/pipeline'} />
          
          <p className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Gestión</p>
          <SidebarItem to="/inventory" icon={<Map size={20} />} label="Inventario" active={location.pathname === '/inventory'} />
          <SidebarItem to="/settings" icon={<Settings size={20} />} label="Configuración" active={location.pathname === '/settings'} />
        </nav>

        {/* User Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
              AD
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">Admin User</p>
              <p className="text-xs text-slate-500 truncate">admin@mirapinos.com</p>
            </div>
            <button className="text-slate-400 hover:text-white transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header: Blanco con borde inferior para separar del contenido */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-xl font-bold text-slate-800">
            {location.pathname === '/' ? 'Resumen General' : 
             location.pathname.includes('leads') ? 'Gestión de Clientes' : 
             'Panel de Administración'}
          </h2>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all w-64"
              />
            </div>
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
          </div>
        </header>

        {/* Área de Scroll con fondo gris claro */}
        <div className="flex-1 overflow-auto p-8 bg-slate-100">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ to, icon, label, active }: { to: string, icon: React.ReactNode, label: string, active: boolean }) {
  return (
    <Link 
      to={to}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${active 
          ? 'bg-emerald-600 text-white shadow-md' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }
      `}
    >
      {icon}
      {label}
    </Link>
  );
}