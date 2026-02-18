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
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

// Tipo base de la tabla agenda
type AgendaItem = Database['public']['Tables']['agenda']['Row'];

// Tipo extendido para usar en la vista (con el nombre ya resuelto)
interface ActivityItem extends AgendaItem {
  leadName: string;
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

export default function Dashboard() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    topSources: []
  });

  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (session?.user.id) {
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchAgendaManual()]);
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
      console.error('Error stats:', error);
    }
  };

  // --- NUEVA ESTRATEGIA: Carga en dos pasos (sin JOIN) ---
  const fetchAgendaManual = async () => {
    try {
      // Paso 1: Obtener las tareas
      const { data: tasks, error: tasksError } = await supabase
        .from('agenda')
        .select('*')
        .order('due_date', { ascending: true })
        .limit(10);

      if (tasksError) throw tasksError;
      if (!tasks || tasks.length === 0) {
        setActivities([]);
        return;
      }

      // Paso 2: Recopilar IDs de leads únicos
      // Filtramos los que tengan lead_id (no nulos)
      const leadIds = Array.from(new Set(tasks.map(t => t.lead_id).filter(id => id !== null))) as string[];

      let leadMap: Record<string, string> = {};

      if (leadIds.length > 0) {
        // Paso 3: Obtener los nombres de esos leads
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('id, name')
          .in('id', leadIds);

        if (!leadsError && leadsData) {
          // Crear mapa rápido: { "id-123": "Juan", "id-456": "Maria" }
          leadsData.forEach(l => {
            leadMap[l.id] = l.name;
          });
        }
      }

      // Paso 4: Combinar datos
      const combinedData: ActivityItem[] = tasks.map(task => ({
        ...task,
        // Buscamos el nombre en el mapa, si no existe ponemos 'Desconocido'
        leadName: task.lead_id ? (leadMap[task.lead_id] || 'Lead no encontrado') : 'Sin asignar'
      }));

      setActivities(combinedData);

    } catch (err) {
      console.error('Error cargando agenda:', err);
    }
  };

  const handleDeleteActivity = async (id: number) => {
    if (!window.confirm("¿Eliminar esta tarea permanentemente?")) return;

    try {
      const { error } = await supabase.from('agenda').delete().eq('id', id);
      if (error) throw error;
      setActivities(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error al borrar:', error);
    }
  };

  // Utilidades de formato
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
        <p className="text-slate-500">Panel de control general.</p>
      </div>

      {/* STATS */}
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
              change="Registrados" 
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* AGENDA (DATOS REALES) */}
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
              VER CALENDARIO
            </button>
          </div>
          
          <div className="divide-y divide-slate-100 flex-1 overflow-auto max-h-[500px]">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Calendar size={40} className="mb-3 opacity-30" />
                <p className="text-sm">No hay tareas pendientes</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    {/* Icono */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      activity.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {activity.completed ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                    </div>
                    
                    {/* Datos de la tarea */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {activity.type}
                        </span>
                        <p className={`text-sm font-bold ${activity.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                          {activity.leadName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span className="font-medium">{activity.title}</span>
                        <span>•</span>
                        <span className={new Date(activity.due_date) < new Date() && !activity.completed ? "text-red-500 font-bold" : ""}>
                          {formatDateTime(activity.due_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Botón borrar */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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

        {/* LEADS RECIENTES (UI Estática o conectable similar) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Accesos Rápidos</h3>
          </div>
          <div className="p-6 space-y-4">
            <button 
              onClick={() => navigate('/leads')}
              className="w-full py-3 bg-slate-900 text-white rounded-lg text-sm font-bold shadow hover:bg-slate-800 transition-all active:scale-95"
            >
              Gestionar Clientes (Leads)
            </button>
            <button 
              onClick={() => navigate('/inventory')}
              className="w-full py-3 border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all active:scale-95"
            >
              Ver Inventario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componentes pequeños UI
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