// src/pages/Dashboard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../components/Shared';
import { 
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  const handleDownloadReport = () => {
    alert("Generando reporte PDF... La descarga comenzará en breve.");
  };

  const handleNewLead = () => {
    navigate('/leads');
    // Nota: Aquí se podría abrir un modal directamente si existiera el componente
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex justify-between items-end">
        <div>
          <p className="text-pine-600 font-bold uppercase tracking-[0.3em] text-[10px] mb-2">Visión General</p>
          <h1 className="text-4xl font-poppins font-bold text-slate-900 tracking-tight">Panel de Control</h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleDownloadReport}
            className="px-6 py-3 bg-white text-slate-600 font-bold rounded-2xl border border-pine-100 shadow-sm hover:bg-slate-50 transition-all text-sm"
          >
            Descargar Reporte
          </button>
          <button 
            onClick={handleNewLead}
            className="px-6 py-3 bg-pine-900 text-white font-bold rounded-2xl shadow-lg shadow-pine-900/20 hover:bg-pine-800 transition-all text-sm flex items-center gap-2"
          >
            Nuevo Lead <ArrowUpRight size={18} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Leads Activos" value="124" subtext="+12% este mes" color="text-pine-600" />
        <StatCard title="Visitas Programadas" value="18" subtext="Hoy" color="text-amber-500" />
        <StatCard title="Tasa de Cierre" value="24%" subtext="Objetivo: 30%" color="text-pine-900" />
        <StatCard title="Ventas Totales" value="M€ 2.4" subtext="Q1 2024" color="text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-4xl p-8 border border-pine-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-poppins font-bold text-xl text-slate-900">Rendimiento Semanal</h3>
            <select className="bg-pine-50 border-none rounded-xl text-xs font-bold p-2 outline-none cursor-pointer">
              <option>Últimos 7 días</option>
              <option>Últimos 30 días</option>
            </select>
          </div>
          <div className="h-64 bg-pine-50/50 rounded-3xl border border-dashed border-pine-200 flex items-center justify-center">
            <p className="text-pine-600/40 font-bold text-sm italic">Área del gráfico de actividad</p>
          </div>
        </div>

        <div className="bg-pine-900 rounded-4xl p-8 shadow-2xl shadow-pine-900/30 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="font-poppins font-bold text-xl mb-6">Próximas Visitas</h3>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  onClick={() => navigate('/pipeline')}
                  className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors cursor-pointer group"
                >
                  <div className="w-10 h-10 bg-pine-600 rounded-xl flex items-center justify-center font-bold text-xs">0{i+9}</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">Familia García {i}</p>
                    <p className="text-[10px] text-pine-400 font-bold uppercase tracking-wider">10:30 AM - Parcela 24</p>
                  </div>
                  <ChevronRight size={16} className="text-pine-600 opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              ))}
            </div>
            <button 
              onClick={() => navigate('/pipeline')}
              className="w-full mt-6 py-4 bg-white text-pine-900 font-bold rounded-2xl text-xs uppercase tracking-widest hover:bg-pine-100 transition-colors"
            >
              Ver Calendario
            </button>
          </div>
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-pine-600/10 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}