// src/pages/Pipeline.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Loader2, 
  TrendingUp, 
  DollarSign, 
  MoreHorizontal,
  ChevronRight
} from 'lucide-react';
import type { Database } from '../types/supabase';

type Lead = Database['public']['Tables']['leads']['Row'];

// Definición de las columnas del Pipeline
const COLUMNS: { id: Lead['status']; title: string; color: string }[] = [
  { id: 'new', title: 'Nuevos', color: 'bg-blue-500' },
  { id: 'contacted', title: 'Contactados', color: 'bg-purple-500' },
  { id: 'qualified', title: 'Cualificados', color: 'bg-emerald-500' },
  { id: 'proposal', title: 'Propuesta', color: 'bg-amber-500' },
  { id: 'negotiation', title: 'Negociación', color: 'bg-orange-500' }
];

export default function Pipeline() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setLeads(data);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  }

  // Calcular el valor total del pipeline activo (excluyendo cerrados/perdidos)
  const totalValue = leads
    .filter(l => l.status !== 'closed' && l.status !== 'lost')
    .reduce((acc, curr) => acc + (curr.value || 0), 0);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
        <p className="text-slate-400 animate-pulse font-medium">Cargando túnel de ventas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header con KPIs */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-emerald-600 font-bold uppercase tracking-[0.3em] text-[10px] mb-2">Rendimiento Comercial</p>
          <h1 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Túnel de Ventas</h1>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 min-w-[200px]">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Valor Activo</p>
              <p className="text-lg font-bold text-slate-900">
                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalValue)}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Tablero Kanban */}
      <div className="flex gap-6 overflow-x-auto pb-8 min-h-[600px] -mx-4 px-4">
        {COLUMNS.map((column) => {
          const columnLeads = leads.filter(l => l.status === column.id);
          const columnValue = columnLeads.reduce((acc, curr) => acc + (curr.value || 0), 0);

          return (
            <div key={column.id} className="flex-shrink-0 w-80 flex flex-col gap-4">
              {/* Cabecera de Columna */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${column.color}`}></div>
                  <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider">{column.title}</h3>
                  <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {columnLeads.length}
                  </span>
                </div>
                <button className="text-slate-400 hover:text-slate-600">
                  <MoreHorizontal size={16} />
                </button>
              </div>

              {/* Contenedor de Tarjetas */}
              <div className="bg-slate-50/50 p-3 rounded-3xl border border-slate-100 flex-1 space-y-3">
                {columnLeads.map((lead) => (
                  <div 
                    key={lead.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-800 text-sm leading-tight group-hover:text-emerald-700 transition-colors">
                        {lead.name}
                      </h4>
                    </div>
                    
                    <p className="text-[11px] text-slate-400 mb-4 line-clamp-1 italic">
                      {lead.company || 'Sin empresa'}
                    </p>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                      <div className="flex items-center gap-1 text-slate-700 font-bold text-xs">
                        <DollarSign size={12} className="text-emerald-500" />
                        {lead.value ? new Intl.NumberFormat('es-ES').format(lead.value) : '0'}
                      </div>
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-white group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                        <ChevronRight size={12} />
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Indicador de valor de columna */}
                <div className="pt-2 px-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase text-right">
                    Subtotal: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(columnValue)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}