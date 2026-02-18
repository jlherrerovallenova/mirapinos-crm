// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2,
  Pencil,
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

// Definición de tipos basados en la base de datos
type AgendaItem = Database['public']['Tables']['agenda']['Row'] & {
  leads?: { name: string } | null;
};

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

  // Estado para las actividades reales de la base de datos
  const [activities, setActivities] = useState<AgendaItem[]>([]);

  useEffect(() => {
    fetchDashboardData();
    fetchAgendaData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
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

        setStats({
          totalLeads: total,
          topSources: sortedSources
        });
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgendaData = async () => {
    try {
      // Consultamos la tabla agenda uniendo con el nombre del lead
      const { data, error } = await supabase
        .from('agenda')
        .select(`
          *,
          leads (
            name
          )
        `)
        .order('due_date', { ascending: true })
        .limit(5); // Mostramos las 5 más próximas

      if (error) throw error;
      if (data) setActivities(data as AgendaItem[]);
    } catch (error) {
      console.error('Error al cargar agenda:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta acción?")) {
      const { error } = await supabase
        .from('agenda')
        .delete()
        .eq('id', id);
      
      if (!error) {
        setActivities(activities.filter(act => act.id !== id));
      }
    }
  };

  const getSourceIcon = (sourceName: string) => {
    const lower = sourceName.toLowerCase();
    if (lower.includes('web') || lower.includes('google')) return <Globe className="text-blue-600" size={20} />;
    if (lower.includes('insta') || lower.includes('facebook') || lower.includes('social')) return <Smartphone className="text-purple-600" size={20} />;
    if (lower.includes('referido') || lower.includes('amigo')) return <Users className="text-emerald-600" size={20} />;
    if (lower.includes('anuncio') || lower.includes('campaña')) return <Megaphone className="text-orange-600" size={20} />;
    return <HelpCircle className="text-slate-400" size={20} />;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          ¡Hola de nuevo, {session?.user.email?.split('@')[0]}!
        </h1>
        <p className="text-slate-500">Resumen de tus contactos y fuentes de captación.</p>
      </div>

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
              change="Total histórico" 
              isPositive={true} 
              icon={<Users className="text-slate-900" size={20} />} 
              trendIcon={false}
            />

            {stats.topSources.map((source, index) => (
              <StatCard 
                key={index}
                title={`Origen: ${source.name}`} 
                value={source.count.toString()} 
                change={`${source.percentage}% del total`} 
                isPositive={true} 
                icon={getSourceIcon(source.name)} 
                trendIcon={true}
              />
            ))}

            {stats.topSources.length < 3 && Array(3 - stats.topSources.length).fill(0).map((_, i) => (
              <div key={`empty-${i}`} className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                <p className="text-sm font-medium">Sin más datos de origen</p>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AGENDA DE ACTIVIDADES REALES */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Clock size={18} className="text-emerald-500" />
              Agenda de Actividades
            </h3>
            <button 
              onClick={() => navigate('/agenda')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              VER TODAS
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {activities.length === 0 ? (
              <div className="p-10 text-center">
                <Calendar className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-sm text-slate-500 italic">No hay tareas pendientes en la agenda.</p>
              </div>
            ) : (
              activities.map((activity) => {
                const dateObj = new Date(activity.due_date);
                return (
                  <div key={activity.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {activity.completed ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${activity.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                          {activity.type}: {activity.leads?.name || 'Cliente desconocido'}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500">
                          {activity.title} • {dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDelete(activity.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Borrar acción"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ÚLTIMOS LEADS (ESTÁTICO O PUEDES CONECTARLO TAMBIÉN) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Leads Recientes</h3>
          </div>
          <div className="p-6 space-y-6">
            <RecentLead name="Ana Martínez" source="Instagram" time="hace 10 min" />
            <RecentLead name="Carlos Ruiz" source="Web" time="hace 45 min" />
            <RecentLead name="Elena Soler" source="Referido" time="hace 2 horas" />
            
            <button 
              onClick={() => navigate('/leads')}
              className="w-full py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
            >
              Gestionar todos los leads
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, isPositive, icon, trendIcon = true }: { 
  title: string, value: string, change: string, isPositive: boolean, icon: React.ReactNode, trendIcon?: boolean
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        {trendIcon && (
          <div className={`flex items-center text-xs font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span className="ml-1">{change}</span>
          </div>
        )}
        {!trendIcon && (
           <div className="text-xs font-bold text-slate-400">
             {change}
           </div>
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