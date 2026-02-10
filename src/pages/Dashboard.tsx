import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../components/Shared';
import { 
  ArrowUpRight, 
  Calendar, 
  TrendingUp, 
  Users, 
  Download,
  MoreHorizontal 
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Sección de KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Leads Activos" 
          value="124" 
          subtext="+12% vs mes anterior" 
          icon={<Users size={24} />} 
          type="primary" 
        />
        <StatCard 
          title="Visitas Hoy" 
          value="18" 
          subtext="3 pendientes de confirmar" 
          icon={<Calendar size={24} />} 
          type="warning" 
        />
        <StatCard 
          title="Ventas Totales" 
          value="2.4M€" 
          subtext="Objetivo: 3.0M€ (80%)" 
          icon={<TrendingUp size={24} />} 
          type="success" 
        />
        <StatCard 
          title="Tasa Conversión" 
          value="24%" 
          subtext="Estable respecto a Q1" 
          icon={<ArrowUpRight size={24} />} 
          type="neutral" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Gráfico Principal - Caja Blanca Definida */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
                <h3 className="font-bold text-slate-800">Actividad Reciente</h3>
                <p className="text-xs text-slate-500">Resumen de interacciones y ventas</p>
            </div>
            <select className="text-sm bg-white border border-slate-200 rounded shadow-sm text-slate-600 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500">
              <option>Últimos 30 días</option>
              <option>Este Año</option>
            </select>
          </div>
          <div className="p-6 flex-1 min-h-[300px]">
            {/* Placeholder del Gráfico */}
            <div className="h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400">
              <TrendingUp size={48} className="mb-2 opacity-20" />
              <span className="font-medium text-sm">Área del Gráfico de Rendimiento</span>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex justify-end">
             <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
               Ver reporte completo <ArrowUpRight size={14} />
             </button>
          </div>
        </div>

        {/* Lista Lateral - Caja Blanca Definida */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Próximas Citas</h3>
            <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={18}/></button>
          </div>
          
          <div className="flex-1 overflow-auto divide-y divide-slate-50">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-3 group cursor-pointer" onClick={() => navigate('/pipeline')}>
                <div className="bg-emerald-50 text-emerald-700 w-12 h-12 rounded-lg border border-emerald-100 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] uppercase font-bold text-emerald-600/70">Feb</span>
                  <span className="text-lg font-bold leading-none">{10 + i}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">Familia García {i}</p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <Calendar size={12} /> 
                    <span>10:30 AM</span>
                    <span className="text-slate-300">|</span>
                    <span className="truncate">Parcela 24</span>
                  </div>
                </div>
                <button className="self-center text-slate-300 group-hover:text-emerald-600 transition-colors">
                  <ArrowUpRight size={16} />
                </button>
              </div>
            ))}
          </div>
          
          <div className="p-3 bg-slate-50 mt-auto border-t border-slate-100">
            <button 
                onClick={() => navigate('/pipeline')}
                className="w-full text-center text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 py-2 rounded transition-colors"
            >
              Ver Agenda Completa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}