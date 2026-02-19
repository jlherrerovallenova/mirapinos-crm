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
  Clock,
  Calendar,
  CheckCircle2,
  Trash2,
  Circle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

// --- TIPOS ---
type AgendaItem = Database['public']['Tables']['agenda']['Row'] & {
  leads?: { name: string } | null
};

interface SourceStat {
  name: string;
  count: number;
  percentage: number;
}

export default function Dashboard() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState<{ totalLeads: number; topSources: SourceStat[] }>({
    totalLeads: 0,
    topSources: []
  });
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);

  useEffect(() => {
    if (session?.user.id) {
      loadDashboardData();
    }
  }, [session]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. CARGA DE DATOS GENERALES
      const [leadsRes, recentRes] = await Promise.all([
        supabase.from('leads').select('source'),
        supabase.from('leads').select('id, name, source, created_at').order('created_at', { ascending: false }).limit(5)
      ]);

      if (leadsRes.data) {
        const total = leadsRes.data.length;
        const counts: Record<string, number> = {};
        leadsRes.data.forEach(l => {
          const s = l.source?.trim() || 'Desconocido';
          counts[s] = (counts[s] || 0) + 1;
        });
        const top = Object.entries(counts)
          .map(([name, count]) => ({
            name,
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);
        setStats({ totalLeads: total, topSources: top });
      }

      if (recentRes.data) setRecentLeads(recentRes.data);

      // 2. CARGA DE AGENDA (Ahora con relación leads(name) funcional)
      const { data: agendaData } = await supabase
        .from('agenda')
        .select('*, leads(name)')
        .eq('completed', false)
        .order('due_date', { ascending: true })
        .limit(10);

      if (agendaData) {
        const formatted = agendaData.map(item => ({
          ...item,
          leads: Array.isArray(item.leads) ? item.leads[0] : item.leads
        })) as AgendaItem[];
        setAgenda(formatted);
      }
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (task: AgendaItem) => {
    const { error } = await supabase
      .from('agenda')
      .update({ completed: !task.completed })
      .eq('id', task.id);
    
    if (!error) loadDashboardData();
  };

  const deleteTask = async (id: number) => {
    if (!window.confirm("¿Eliminar esta tarea?")) return;
    const { error } = await supabase.from('agenda').delete().eq('id', id);
    if (!error) loadDashboardData();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Panel de Control</h1>
        <p className="text-slate-500">Hola {session?.user.email?.split('@')[0]}, resumen de actividad.</p>
      </header>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Contactos" 
          value={stats.totalLeads.toString()} 
          icon={<Users className="text-slate-900" size={20} />} 
        />
        {stats.topSources.map((source, index) => (
          <StatCard 
            key={index}
            title={`Origen: ${source.name}`} 
            value={source.count.toString()} 
            change={`${source.percentage}%`} 
            icon={<Globe className="text-blue-600" size={20} />} 
            trendIcon
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* WIDGET AGENDA */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Clock size={18} className="text-emerald-500" />
              Agenda de Acciones
            </h3>
            <button 
              onClick={() => navigate('/agenda')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors bg-emerald-50 px-3 py-1.5 rounded-full"
            >
              VER CALENDARIO
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
            {agenda.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Calendar size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-medium text-slate-600">Todo al día</p>
              </div>
            ) : (
              agenda.map((task) => (
                <div key={task.id} className="p-4 hover:bg-slate-50 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => toggleTask(task)}
                      className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-200 text-slate-300 hover:border-emerald-500 hover:text-emerald-500 transition-colors"
                    >
                      <Circle size={20} />
                    </button>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border bg-slate-50 text-slate-600 border-slate-100">
                          {task.type}
                        </span>
                        <span className="text-sm font-bold text-slate-800">
                          {task.leads?.name || 'Sin cliente vinculado'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-medium">{task.title}</span>
                        <span>•</span>
                        <span>{new Date(task.due_date).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMNA LATERAL: LEADS RECIENTES */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-sm">Leads Recientes</h3>
          </div>
          <div className="p-4 space-y-4">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-[10px] border border-slate-200">
                  {lead.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-800 truncate">{lead.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{lead.source || 'Sin origen'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon, trendIcon = false }: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        {trendIcon && (
          <div className="flex items-center text-xs font-bold text-emerald-600">
            <ArrowUpRight size={14} className="mr-1" />
            {change}
          </div>
        )}
      </div>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <h4 className="text-2xl font-bold text-slate-900 mt-1">{value}</h4>
    </div>
  );
}