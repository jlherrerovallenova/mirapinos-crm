// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  Globe,
  Smartphone,
  HelpCircle,
  Megaphone,
  Clock,      // <-- Faltaba este import
  Calendar    // <-- Añadido para el botón de agenda
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface SourceStat {
  name: string;
  count: number;
  percentage: number;
}

interface RecentLead {
  id: string;
  name: string;
  source: string | null;
  created_at: string;
}

export default function Dashboard() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Estado para métricas
  const [stats, setStats] = useState<{ totalLeads: number; topSources: SourceStat[] }>({
    totalLeads: 0,
    topSources: []
  });

  // Estado para leads recientes
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);

  useEffect(() => {
    if (session?.user.id) {
      loadDashboardData();
    }
  }, [session]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. CARGAR ESTADÍSTICAS Y LEADS RECIENTES EN PARALELO
      const [leadsResponse, recentResponse] = await Promise.all([
        // Query para estadísticas (todos los leads)
        supabase.from('leads').select('source'),
        
        // Query para leads recientes (últimos 5)
        supabase.from('leads')
          .select('id, name, source, created_at')
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      // Procesar Estadísticas
      if (!leadsResponse.error && leadsResponse.data) {
        const total = leadsResponse.data.length;
        const sourceCounts: Record<string, number> = {};
        
        leadsResponse.data.forEach(lead => {
          const source = lead.source ? lead.source.trim() : 'Desconocido';
          sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        });

        const sortedSources = Object.entries(sourceCounts)
          .map(([name, count]) => ({
            name,
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        setStats({ totalLeads: total, topSources: sortedSources });
      }

      // Procesar Leads Recientes
      if (!recentResponse.error && recentResponse.data) {
        setRecentLeads(recentResponse.data);
      }

    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  const getSourceIcon = (sourceName: string) => {
    const lower = sourceName.toLowerCase();
    if (lower.includes('web') || lower.includes('google')) return <Globe className="text-blue-600" size={20} />;
    if (lower.includes('insta') || lower.includes('facebook')) return <Smartphone className="text-purple-600" size={20} />;
    if (lower.includes('referido') || lower.includes('amigo')) return <Users className="text-emerald-600" size={20} />;
    if (lower.includes('anuncio') || lower.includes('campaña')) return <Megaphone className="text-orange-600" size={20} />;
    return <HelpCircle className="text-slate-400" size={20} />;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 60) return `hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `hace ${Math.floor(diffInMinutes / 60)} h`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Panel de Control
        </h1>
        <p className="text-slate-500">
          Hola {session?.user.email?.split('@')[0]}, aquí tienes el resumen de hoy.
        </p>
      </div>

      {/* TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
           Array(4).fill(0).map((_, i) => (
             <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-32 animate-pulse" />
           ))
        ) : (
          <>
            <StatCard 
              title="Total Contactos" 
              value={stats.totalLeads.toString()} 
              change="Base de Datos" 
              isPositive={true} 
              icon={<Users className="text-slate-900" size={20} />} 
              trendIcon={false}
            />
            {stats.topSources.map((source, index) => (
              <StatCard 
                key={index}
                title={`Origen: ${source.name}`} 
                value={source.count.toString()} 
                change={`${source.percentage}%`} 
                isPositive={true} 
                icon={getSourceIcon(source.name)} 
                trendIcon={true}
              />
            ))}
            {stats.topSources.length < 3 && Array(3 - stats.topSources.length).fill(0).map((_, i) => (
              <div key={`empty-${i}`} className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                <p className="text-xs">Sin datos suficientes</p>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* WIDGET 1: LEADS RECIENTES (Rellena el hueco dejado por la agenda) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Últimos Clientes Registrados</h3>
            <button 
              onClick={() => navigate('/leads')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              VER TODOS
            </button>
          </div>
          <div className="p-6 space-y-4 flex-1">
            {recentLeads.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p className="text-sm">No hay clientes recientes.</p>
              </div>
            ) : (
              recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm group-hover:bg-slate-200 transition-colors">
                      {lead.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{lead.name}</p>
                      <p className="text-xs text-slate-500">{lead.source || 'Sin origen'}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-full">
                    {formatTime(lead.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* WIDGET 2: ACCESOS RÁPIDOS */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Accesos Rápidos</h3>
          </div>
          <div className="p-6 space-y-4">
            <button 
              onClick={() => navigate('/leads')}
              className="w-full py-4 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Users size={18} /> Gestionar Clientes (Leads)
            </button>
            <div className="grid grid-cols-2 gap-4">
               <button 
                onClick={() => navigate('/inventory')}
                className="w-full py-4 border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Clock size={18} /> Inventario
              </button>
               <button 
                onClick={() => navigate('/agenda')}
                className="w-full py-4 border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Calendar size={18} /> Agenda
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Componente simple para las tarjetas
function StatCard({ title, value, change, isPositive, icon, trendIcon = true }: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        {trendIcon ? (
          <div className={`flex items-center text-xs font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span className="ml-1">{change}</span>
          </div>
        ) : (
           <div className="text-xs font-bold text-slate-400">{change}</div>
        )}
      </div>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <h4 className="text-2xl font-bold text-slate-900 mt-1">{value}</h4>
    </div>
  );
}