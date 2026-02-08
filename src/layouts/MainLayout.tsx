// src/layouts/MainLayout.tsx
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Map, Settings, Search } from 'lucide-react';

export default function MainLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-pine-50 font-lato text-slate-700">
      
      {/* SIDEBAR FLOTANTE */}
      <aside className="w-72 bg-pine-900 text-white flex flex-col m-4 rounded-4xl shadow-2xl shadow-pine-900/20">
        
        {/* --- SECCIÓN DEL LOGO (FONDO BLANCO Y BORDE VERDE) --- */}
        <div className="mx-6 mt-6 mb-2 p-6 bg-white border-2 border-pine-600 rounded-3xl shadow-lg shadow-pine-900/50">
          <div className="flex items-center gap-3">
            {/* Imagen del Logo */}
            <img 
              src="/logo_mirapinos.png" 
              alt="Logo Mirapinos" 
              className="h-8 w-auto object-contain transition-transform duration-300 hover:scale-110" 
            />
            
            {/* Texto de Marca (Color oscuro para contraste) */}
            <h1 className="text-xl font-poppins font-bold tracking-tight text-pine-900 leading-none">
              Mirapinos
            </h1>
          </div>
          
          {/* Subtítulo */}
          <p className="text-[9px] uppercase tracking-[0.3em] text-pine-600 font-bold mt-3 ml-1">
            Premium CRM
          </p>
        </div>
        {/* ----------------------------------------------------- */}
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarItem to="/" icon={<LayoutDashboard size={22} />} label="Dashboard" active={location.pathname === '/'} />
          <SidebarItem to="/leads" icon={<Users size={22} />} label="Clientes" active={location.pathname.startsWith('/leads')} />
          <SidebarItem to="/pipeline" icon={<Calendar size={22} />} label="Ventas" active={location.pathname === '/pipeline'} />
          <SidebarItem to="/inventory" icon={<Map size={22} />} label="Inventario" active={location.pathname === '/inventory'} />
        </nav>

        <div className="p-6 border-t border-white/10">
          <SidebarItem to="/settings" icon={<Settings size={20} />} label="Ajustes" active={location.pathname === '/settings'} />
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-24 flex items-center justify-between px-10">
          <div className="relative w-96">
            <Search className="absolute left-4 top-3 text-slate-400" size={18} />
            <input 
              className="w-full pl-12 pr-4 py-3 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-pine-600/20 outline-none text-sm transition-all" 
              placeholder="Buscar en el ecosistema..." 
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900">Admin Mirapinos</p>
              <p className="text-[10px] text-pine-600 font-bold uppercase">Valladolid Office</p>
            </div>
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-pine-100 flex items-center justify-center text-pine-600 font-bold">
              AM
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto px-10 pb-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

// Componente auxiliar para los items del sidebar
function SidebarItem({ to, icon, label, active }: any) {
  return (
    <Link 
      to={to}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-300 ${
        active 
          ? 'bg-pine-600 text-white shadow-lg shadow-pine-600/20 translate-x-2' 
          : 'text-pine-100/50 hover:bg-white/5 hover:text-white'
      }`}
    >
      {icon} {label}
    </Link>
  );
}