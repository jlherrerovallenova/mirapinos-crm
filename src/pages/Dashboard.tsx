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
  AlertCircle,
  Bug
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

// --- TIPOS ---
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

type AgendaItem = Database['public']['Tables']['agenda']['Row'] & {
  leads?: { name: string } | null
};

export default function Dashboard() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Estados de Datos
  const [stats, setStats] = useState<{ totalLeads: number; topSources: SourceStat[] }>({
    totalLeads: 0,
    topSources: []
  });
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);

  // Estado de Diagnóstico (NUEVO)
  const [debug, setDebug] = useState({ error: null as any, data: null as any, count: 0 });

  useEffect(() => {
    if (session?.user.id) {
      loadDashboardData();
    }
  }, [session]);

  const loadDashboardData = async () => {
    setLoading(true);
    
    try {
      // 1. CARGA DE LEADS Y ESTADÍSTICAS
      const leadsResponse = await supabase.from('leads').select('source');
      const recentResponse = await supabase.from('leads').select('id, name, source, created_at').order('created_at', { ascending: false }).limit(5);
      
      if (leadsResponse.data) {
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

      if (recentResponse.data) {
        setRecentLeads(recentResponse.data);
      }

      // 2. CARGA DE AGENDA CON DIAGNÓSTICO
      let query = supabase
        .from('agenda')
        .select('*, leads(name)', { count: 'exact' })
        .eq('completed', false)
        .order('due_date', { ascending: true });

      const { data: agendaData, error: agendaError, count } = await query.range(0, 7); // Mismo rango que Agenda.tsx (página 1)

      // Guardamos la respuesta cruda de Supabase para verla en pantalla
      setDebug({
        error: agendaError ? agendaError.message || JSON.stringify(agendaError) : 'Ninguno',
        data: agendaData,
        count: count || 0
      });

      if (!agendaError && agendaData) {
        const formattedData = (agendaData || []).map(item => ({
          ...item,
          leads: Array.isArray(item.leads) ? item.leads[0] : item.leads
        })) as AgendaItem[];
        
        setAgenda(formattedData);
      }

    } catch (error: any) {
      console.error("Error general cargando dashboard:", error);
      setDebug(prev => ({ ...prev, error: `Crash general: ${error.message}` }));
    } finally {
      setLoading(false);
    }
  };

  // --- ACCIONES DE LA AGENDA ---

  const toggleTask = async (task: AgendaItem) => {
    const newStatus = !task.completed;
    if (newStatus) {
       setAgenda(prev => prev.filter(t => t.id !== task.id));
    } else {
       setAgenda(prev => prev.map(t => t.id === task.id ? { ...t, completed: newStatus } : t));
    }

    try {
      await supabase.from('agenda').update({ completed: newStatus }).eq('id', task.id);
    } catch (error) {
      console.error("Error actualizando tarea:", error);
      loadDashboardData();
    }
  };

  const deleteTask = async (id: number) => {
    if (!window.confirm("¿Eliminar esta tarea de la agenda?")) return;
    setAgenda(prev => prev.filter(t => t.id !== id));

    try {
      await supabase.from('agenda').delete().eq('id', id);
    } catch (error) {
      console.error("Error eliminando tarea:", error);
      loadDashboardData();
    }
  };

  // --- HELPERS ---
  const getSourceIcon = (sourceName: string) => {
    const lower = sourceName.toLowerCase();
    if (lower.includes('web') || lower.includes('google')) return <Globe className="text-blue-600" size={20} />;
    if (lower.includes('insta') || lower.includes('facebook')) return <Smartphone className="text-purple-600" size={20} />;
    if (lower.includes('referido') || lower.includes('amigo')) return <Users className="text-emerald-600" size={20} />;
    return <HelpCircle className="text-slate-400" size={20} />;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Panel de Control</h1>
        <p className="text-slate-500">Hola {session?.user.email?.split('@')[0]}, resumen de actividad.</p>
      </div>

      {/* METRICAS */}
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
                <p className="text-xs">Sin datos</p>
              </div>
            ))}
          </>
        )}
      </div>

      {/* BLOQUE DE DIAGNÓSTICO PARA LA AGENDA */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 font-mono overflow-auto max-h-64 shadow-inner">
        <h4 className="font-bold flex items-center gap-2 mb-2 text-amber-700">
          <Bug size={16}/> 
          Diagnóstico de Conexión de Agenda
        </h4>
        <p className="mb-1"><strong className="text-amber-800">Error detectado:</strong> {debug.error}</p>
        <p className="mb-1"><strong className="text-amber-800">Tareas pendientes (Count):</strong> {debug.count}</p>
        <div><strong className="text-amber-800">Datos Crudos recibidos:</strong> 
          <pre className="mt-2 bg-white/50 p-2 rounded border border-amber-100 whitespace-pre-wrap">
            {debug.data ? JSON.stringify(debug.data, null, 2) : 'Cargando o Null...'}
          </pre>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* WIDGET 1: AGENDA DE ACCIONES */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Clock size={18} className="text-emerald-500" />
              Agenda de Acciones (Pendientes)
            </h3>
            <button 
              onClick={() => navigate('/agenda')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors bg-emerald-50 px-3 py-1.5 rounded-full"
            >
              VER CALENDARIO
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[500px]">
            {agenda.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Calendar size={48} className="mb-4 opacity-20 text-slate-500" />
                <p className="text-sm font-medium text-slate-600">Todo al día</p>
                <p className="text-xs opacity-60">No tienes acciones pendientes</p>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <p className="text-sm font-medium animate-pulse">Cargando agenda...</p>
              </div>
            ) : (
              agenda.map((task) => {
                const dateObj = new Date(task.due_date);
                const isOverdue = dateObj < new Date() && !task.completed;
                
                return (
                  <div key={task.id} className={`p-4 hover:bg-slate-50 transition-all flex items-center justify-between group ${task.completed ? 'bg-slate-50/50' : 'bg-white'}`}>
                    <div className="flex items-center gap-4">
                      {/* Botón Completar */}
                      <button 
                        onClick={() => toggleTask(task)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all shadow-sm ${
                          task.completed 
                            ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' 
                            : 'bg-white border border-slate-200 text-slate-300 hover:border-emerald-400 hover:text-emerald-500'
                        }`}
                      >
                        {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                      </button>
                      
                      {/* Info Tarea */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                            task.type === 'Llamada' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            task.type === 'Visita' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                            'bg-slate-50 text-slate-600 border-slate-100'
                          }`}>
                            {task.type}
                          </span>
                          <span className={`text-sm font-bold ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                            {task.leads?.name || 'Sin cliente vinculado'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-medium">{task.title}</span>
                          <span>•</span>
                          <span className={`${isOverdue ? "text-red-500 font-bold flex items-center gap-1" : ""}`}>
                            {isOverdue && <AlertCircle size={10} />}
                            {dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} a las {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Botón Borrar */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => deleteTask(task.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMNA LATERAL */}
        <div className="space-y-8">
          
          {/* WIDGET 2: LEADS RECIENTES */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm">Leads Recientes</h3>
              <button onClick={() => navigate('/leads')} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">
                VER TODOS
              </button>
            </div>
            <div className="p-4 space-y-3">
              {recentLeads.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-4">No hay leads recientes</p>
              ) : (
                recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-default">
                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs border border-slate-200">
                      {lead.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-800 truncate">{lead.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{lead.source || 'Sin origen'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* WIDGET 3: ACCESOS RÁPIDOS */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm">Accesos Rápidos</h3>
            </div>
            <div className="p-5 space-y-3">
              <button 
                onClick={() => navigate('/leads')}
                className="w-full py-3 bg-slate-900 text-white rounded-lg text-xs font-bold shadow hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Users size={14} /> Gestionar Clientes
              </button>
              <div className="grid grid-cols-2 gap-3">
                 <button 
                  onClick={() => navigate('/inventory')}
                  className="w-full py-3 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Clock size={14} /> Inventario
                </button>
                 <button 
                  onClick={() => navigate('/agenda')}
                  className="w-full py-3 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Calendar size={14} /> Agenda
                </button>
              </div>
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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
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