// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  TrendingUp, 
  Home, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  Euro,
  Loader2
} from 'lucide-react';
import type { Database } from '../types/supabase';

type Lead = Database['public']['Tables']['leads']['Row'];
type Property = Database['public']['Tables']['inventory']['Row'];

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const [leadsRes, propsRes] = await Promise.all([
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('inventory').select('*')
      ]);

      if (leadsRes.data) setLeads(leadsRes.data);
      if (propsRes.data) setProperties(propsRes.data);
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  // Cálculos de métricas
  const totalPipelineValue = leads
    .filter(l => l.status !== 'closed' && l.status !== 'lost')
    .reduce((acc, curr) => acc + (curr.value || 0), 0);

  const activeProperties = properties.filter(p => p.status === 'available').length;
  const closedDeals = leads.filter(l => l.status === 'closed').length;

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
        <p className="text-slate-400 animate-pulse font-medium">Generando informe diario...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Bienvenida y Resumen Rápido */}
      <header>
        <p className="text-emerald-600 font-bold uppercase tracking-[0.3em] text-[10px] mb-2">Visión General</p>
        <h1 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Panel de Control</h1>
      </header>

      {/* Tarjetas de Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Leads" 
          value={leads.length} 
          icon={<Users size={20}/>} 
          trend="+12%" 
          trendUp={true}
          color="bg-blue-500"
        />
        <StatCard 
          title="Valor Pipeline" 
          value={new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(totalPipelineValue)} 
          icon={<TrendingUp size={20}/>} 
          trend="+5.4%" 
          trendUp={true}
          color="bg-emerald-500"
        />
        <StatCard 
          title="Stock Activo" 
          value={activeProperties} 
          icon={<Home size={20}/>} 
          trend="-2" 
          trendUp={false}
          color="bg-amber-500"
        />
        <StatCard 
          title="Ventas Cerradas" 
          value={closedDeals} 
          icon={<Euro size={20}/>} 
          trend="+3" 
          trendUp={true}
          color="bg-slate-900"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Actividad Reciente (Leads) */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900">Actividad Reciente</h3>
            <Clock className="text-slate-300" size={20} />
          </div>
          
          <div className="space-y-6">
            {leads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                    {lead.name?.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{lead.name}</p>
                    <p className="text-xs text-slate-400">{new Date(lead.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${
                    lead.status === 'new' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                  }`}>
                    {lead.status}
                  </span>
                  <p className="font-bold text-slate-700 text-sm">
                    {lead.value ? `${new Intl.NumberFormat('es-ES').format(lead.value)} €` : '--'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen de Inventario */}
        <div className="bg-slate-900 rounded-[2.5rem] shadow-xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-6">Estado del Inventario</h3>
            <div className="space-y-8 mt-10">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Disponible</p>
                  <p className="text-3xl font-display font-bold">
                    {properties.filter(p => p.status === 'available').length}
                  </p>
                </div>
                <div className="h-1 w-24 bg-emerald-500 rounded-full mb-2"></div>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Reservado</p>
                  <p className="text-3xl font-display font-bold">
                    {properties.filter(p => p.status === 'reserved').length}
                  </p>
                </div>
                <div className="h-1 w-12 bg-amber-500 rounded-full mb-2"></div>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Vendido</p>
                  <p className="text-3xl font-display font-bold">
                    {properties.filter(p => p.status === 'sold').length}
                  </p>
                </div>
                <div className="h-1 w-32 bg-blue-500 rounded-full mb-2"></div>
              </div>
            </div>
          </div>
          
          {/* Decoración de fondo */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}

// Subcomponente para las tarjetas de estadísticas
function StatCard({ title, value, icon, trend, trendUp, color }: any) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 ${color} text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend} {trendUp ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-display font-bold text-slate-900 mt-1">{value}</p>
      </div>
    </div>
  );
}