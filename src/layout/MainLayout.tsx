import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Map, Settings, Plus } from 'lucide-react';

export default function MainLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-slate-800">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold tracking-tight text-emerald-400">Mirapinos</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" active={location.pathname === '/'} />
          <SidebarItem to="/leads" icon={<Users size={20} />} label="Clientes" active={location.pathname.startsWith('/leads')} />
          <SidebarItem to="/pipeline" icon={<Calendar size={20} />} label="Túnel" active={location.pathname === '/pipeline'} />
          <SidebarItem to="/inventory" icon={<Map size={20} />} label="Inventario" active={location.pathname === '/inventory'} />
        </nav>
        <div className="p-4 border-t border-slate-700">
           <SidebarItem to="/settings" icon={<Settings size={18} />} label="Configuración" active={location.pathname === '/settings'} />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10">
           {/* El título puede ser dinámico o parte de cada página */}
           <h2 className="text-xl font-semibold text-slate-700">CRM</h2>
        </header>
        
        <div className="flex-1 overflow-auto p-8">
          {/* AQUÍ SE CARGARÁN LAS PÁGINAS (Dashboard, Leads, etc.) */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ to, icon, label, active }: any) {
  return (
    <Link to={to} className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${active ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
      {icon} {label}
    </Link>
  );
}