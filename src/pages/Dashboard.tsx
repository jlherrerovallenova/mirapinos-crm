// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2,
  Trash2,
  Globe,
  Smartphone,
  Megaphone,
  HelpCircle,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

// --- DEFINICIÓN DE TIPOS MANUAL PARA EVITAR ERRORES DE TS ---

interface LeadRef {
  name: string;
}

// Estructura exacta de la respuesta de Supabase con el JOIN
interface AgendaItemWithLead {
  id: number;
  created_at: string;
  lead_id: string | null;
  title: string;
  type: string;
  due_date: string;
  completed: boolean;
  user_id: string | null;
  // Supabase puede devolver un objeto o un array dependiendo de la relación detectada
  leads: LeadRef | LeadRef[] | null; 
}

interface SourceStat {
  name: string;
  count: number;
  percentage: number;
}

interface DashboardStats {
  totalLeads: number;
  topSources: SourceStat[];
}

// ------------------------------------------------------------

export default function Dashboard() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    topSources: []
  });

  const [activities, setActivities] = useState<AgendaItemWithLead[]>([]);

  useEffect(() => {
    if (session?.user.id) {
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchAgenda()]);
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const { data: leads, error } = await supabase
        .from('leads')
        .select('source');

      if (error) throw error;

      if (leads) {
        const total = leads.length;
        const sourceCounts: Record<string, number> = {};
        leads.forEach(lead => {
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
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const fetchAgenda = async () => {
    try {
      // Intentamos traer la agenda con el nombre del lead
      const { data, error } = await supabase
        .from('agenda')
        .select(`
          *,
          leads (
            name
          )
        `)
        .order('due_date', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Error fetching agenda:', error);
        return;
      }

      if (data) {
        // Forzamos el tipado para manejar la respuesta
        setActivities(data as unknown as AgendaItemWithLead[]);
      }
    } catch (err) {
      console.error('Error inesperado en agenda:', err);
    }
  };

  const handleDeleteActivity = async (id: number) => {
    if (!window.confirm("¿Eliminar esta tarea de la base de datos permanentemente?")) return;

    try {
      const { error } = await supabase.from('agenda').delete().eq('id', id);
      if (error) throw error;
      // Actualizar UI
      setActivities(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error borrando tarea:', error);
      alert('No se pudo borrar la tarea.');
    }
  };

  // Función auxiliar para obtener el nombre del lead de forma segura
  const getLeadName = (item: AgendaItemWithLead) => {
    if (!item.leads) return 'Cliente desconocido';
    if (Array.isArray(item.leads)) {
      return item.leads[0]?.name || 'Cliente desconocido';
    }
    return item.leads.name || 'Cliente desconocido';
  };

  // Formateo de fecha
  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    
    const isToday = date.toDateString() === now.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) return `Hoy, ${timeStr}`;
    return `${date.toLocaleDateString()} ${timeStr}`;
  };

  const getSourceIcon = (sourceName: string) => {
    const lower = sourceName.toLowerCase();
    if (lower.includes('web') || lower.includes('google')) return <Globe className="text-blue-600" size={20} />;
    if (lower.includes('insta') || lower.includes('facebook')) return <Smartphone className="text-purple-600" size={20} />;
    if (lower.includes('referido') || lower.includes('amigo')) return <Users className="text-emerald-600" size={20} />;
    return <HelpCircle className="text-slate-400" size={20} />;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          ¡Hola, {session?.user.email?.split('@')[0]}!
        </h1>
        <p className="text-slate-500">Resumen de actividad en tiempo real.</p>
      </div>

      {/* TARJETAS SUPERIORES */}
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
              change="Base de datos" 
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
                <p className="text-xs font-medium">Sin datos suficientes</p>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* WIDGET AGENDA REAL */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Clock size={18} className="text-emerald-500" />
              Agenda (Próximas Tareas)
            </h3>
            <button 
              onClick={() => navigate('/agenda')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              VER TODO
            </button>
          </div>
          
          <div className="divide-y divide-slate-100 flex-1 overflow-auto max-h-[500px]">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Calendar size={40} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">No hay tareas pendientes</p>
                <p className="text-xs opacity-75 mt-1">Crea tareas desde la ficha de un cliente</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    {/* Icono Estado */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      activity.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {activity.completed ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                    </div>
                    
                    {/* Datos */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {activity.type}
                        </span>
                        <p className={`text-sm font-bold ${activity.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                          {getLeadName(activity)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span className="font-medium">{activity.title}</span>
                        <span className="text-slate-300">•</span>
                        <span className={new Date(activity.due_date) < new Date() && !activity.completed ? "text-red-500 font-bold" : ""}>
                          {formatDateTime(activity.due_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Botón borrar */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity px-2">
                    <button 
                      onClick={() => handleDeleteActivity(activity.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar tarea"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* WIDGET LEADS RECIENTES (Estático o puedes conectarlo luego) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Leads Recientes</h3>
          </div>
          <div className="p-6 space-y-6">
            <RecentLead name="Ana Martínez" source="Instagram" time="Hoy" />
            <RecentLead name="Carlos Ruiz" source="Web" time="Ayer" />
            <RecentLead name="Elena Soler" source="Referido" time="Ayer" />
            
            <button 
              onClick={() => navigate('/leads')}
              className="w-full py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
            >
              Ver todos los leads
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componentes simples para UI
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

function RecentLead({ name, source, time }: { name: string, source: string, time: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
          {name.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">{name}</p>
          <p className="text-xs text-slate-500">{source}</p>
        </div>
      </div>
      <span className="text-[10px] text-slate-400 font-medium">{time}</span>
    </div>
  );
}