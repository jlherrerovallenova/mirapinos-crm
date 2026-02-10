// src/pages/Dashboard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../components/Shared'; // Asegúrate de actualizar este componente también si tiene estilos hardcoded
import { 
  ArrowUpRight,
  Download,
  Calendar,
  MoreHorizontal
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panel de Control</h1>
          <p className="text-slate-500 text-sm mt-1">Resumen de actividad y rendimiento de Mirapinos.</p>
        </div>
        <div className="flex gap-3">
          <button 
            className="px-4 py-2 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all text-sm flex items-center gap-2"
          >
            <Download size={16} /> Exportar
          </button>
          <button 
            onClick={() => navigate('/leads')}
            className="px-4 py-2 bg-pine-600 text-white font-medium rounded-lg shadow-sm hover:bg-pine-700 hover:shadow transition-all text-sm flex items-center gap-2"
          >
            <ArrowUpRight size={16} /> Nuevo Lead
          </button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Aquí deberías actualizar tus StatCards para que usen bg-white, rounded-xl, shadow-card y border-slate-200 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card">
            <div className="text-slate-500 text-sm font-medium mb-2">Leads Activos</div>
            <div className="text-3xl font-bold text-slate-900">124</div>
            <div className="text-emerald-600 text-xs font-medium mt-2 flex items-center gap-1">
                <span className="bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-700">+12%</span>
                <span className="text-slate-400">vs mes anterior</span>
            </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card">
            <div className="text-slate-500 text-sm font-medium mb-2">Visitas Hoy</div>
            <div className="text-3xl font-bold text-slate-900">18</div>
            <div className="text-amber-600 text-xs font-medium mt-2 flex items-center gap-1">
                <span className="bg-amber-50 px-1.5 py-0.5 rounded text-amber-700">Atención</span>
                <span className="text-slate-400">requiere confirmación</span>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card">
            <div className="text-slate-500 text-sm font-medium mb-2">Ventas Q1</div>
            <div className="text-3xl font-bold text-slate-900">2.4M€</div>
            <div className="text-slate-400 text-xs font-medium mt-2">
                Objetivo: <span className="text-slate-600">3.0M€</span>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card">
            <div className="text-slate-500 text-sm font-medium mb-2">Conversión</div>
            <div className="text-3xl font-bold text-slate-900">24%</div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-pine-600 h-full w-[24%]"></div>
            </div>
        </div>
      </div>

      {/* MAIN DASHBOARD CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHART AREA */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-slate-900">Rendimiento de Ventas</h3>
            <select className="bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 px-3 py-1.5 outline-none focus:ring-2 focus:ring-pine-500/20">
              <option>Últimos 30 días</option>
              <option>Este año</option>
            </select>
          </div>
          <div className="h-80 bg-slate-50 rounded-lg border border-dashed border-slate-200 flex items-center justify-center">
            <p className="text-slate-400 text-sm font-medium">Gráfico de Rendimiento</p>
          </div>
        </div>

        {/* UPCOMING EVENTS */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-0 flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-semibold text-slate-900">Próximas Visitas</h3>
            <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={20} /></button>
          </div>
          
          <div className="p-4 space-y-2 flex-1">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className="group flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100"
              >
                <div className="flex flex-col items-center justify-center w-12 h-12 bg-pine-50 text-pine-700 rounded-lg border border-pine-100">
                   <span className="text-xs font-bold uppercase">Feb</span>
                   <span className="text-lg font-bold leading-none">{10 + i}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">Familia García</p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <Calendar size={12} />
                    <span>10:30 AM</span>
                    <span className="text-slate-300">|</span>
                    <span>Parcela 24</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
            <button 
                onClick={() => navigate('/pipeline')}
                className="w-full py-2 text-sm font-medium text-pine-700 hover:text-pine-800 hover:bg-pine-100/50 rounded-lg transition-colors"
            >
                Ver Agenda Completa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}