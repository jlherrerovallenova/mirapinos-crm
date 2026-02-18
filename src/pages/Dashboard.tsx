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

// 1. DEFINICIÓN DE TIPOS REALES
// Extendemos el tipo de la tabla 'agenda' para incluir el objeto 'leads' que traeremos con el JOIN
type AgendaItemWithLead = Database['public']['Tables']['agenda']['Row'] & {
  leads: { name: string } | null;
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
  
  // Estado para las estadísticas
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    topSources: []
  });

  // Estado para las actividades REALES (ya no usamos datos mock)
  const [activities, setActivities] = useState<AgendaItemWithLead[]>([]);

  useEffect(() => {
    if (session?.user.id) {
      fetchDashboardData();
      fetchAgendaData();
    }
  }, [session]);

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
      console.error('Error stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // 2. CONSULTA REAL A LA AGENDA CON JOIN
  const fetchAgendaData = async () => {
    try {
      // Seleccionamos todo de agenda Y el nombre del lead asociado
      const { data, error } = await supabase
        .from('agenda')
        .select(`
          *,
          leads (
            name
          )
        `)
        .order('due_date', { ascending: true }) // Ordenar por fecha más próxima
        .limit(6); // Traemos solo las próximas 6 tareas

      if (error) throw error;

      if (data) {
        // Forzamos el tipo porque Supabase a veces infiere arrays en los joins
        setActivities(data as unknown as AgendaItemWithLead[]);
      }
    } catch (error) {
      console.error('Error agenda:', error);
    }
  };

  // 3. BORRADO REAL EN BASE DE DATOS
  const handleDeleteActivity = async (id: number) => {
    if (!window.confirm("¿Eliminar esta tarea de la base de datos?")) return;

    try {
      const { error } = await supabase.from('agenda').delete().eq('id', id);
      if (error) throw error;
      // Actualizamos el estado local para que desaparezca visualmente
      setActivities(prev => prev.filter(act => act.id !== id));
    } catch (error) {
      console.error('Error al borrar:', error);
    }
  };

  // Ayudante para formatear fechas ISO (2025-02-18T10:00:00...) a algo legible
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  // Iconos fuentes
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
        <p className="text-slate-500">Aquí tienes lo que está pasando hoy en Mirapinos.</p>
      </div>

      {/* STATS CARDS */}
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
                <p className="text-xs">Sin datos suficientes</p>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AGENDA DE ACTIVIDADES REAL */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Clock size={18} className="text-emerald-500" />
              Próximas Actividades
            </h3>
            <button 
              onClick={() => navigate('/agenda')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              VER CALENDARIO COMPLETO
            </button>
          </div>
          
          <div className="divide-y divide-slate-100 flex-1 overflow-auto">
            {activities.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center text-slate-400">
                <Calendar size={32} className="mb-2 opacity-50"/>
                <p className="text-sm italic">No hay tareas pendientes.</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    {/* Icono de estado */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      activity.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {activity.completed ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                    </div>
                    
                    {/* Información Principal */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {activity.type}
                        </span>
                        <p className={`text-sm font-bold ${activity.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                          {/* Usamos el nombre del lead recuperado por el JOIN, o fallback */}
                          {activity.leads?.name || 'Cliente desconocido'}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {activity.title} <span className="mx-1">•</span> {formatDateTime(activity.due_date)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Acciones */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleDeleteActivity(activity.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Borrar tarea"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COMPONENTE DE LEADS RECIENTES (Estático o podrías conectarlo igual) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Leads Recientes</h3>
          </div>
          <div className="p-6 space-y-6">
            <RecentLead name="Carlos Ruiz" source="Web" time="Hoy" />
            <RecentLead name="Ana Lopez" source="Instagram" time="Ayer" />
            <
            button 
              onClick={() => navigate('/leads')}
              className="w-full py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95 mt-4"
            >
              Gestionar Leads
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componentes pequeños para mantener limpio el código
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