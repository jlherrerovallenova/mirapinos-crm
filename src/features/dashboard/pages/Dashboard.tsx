// src/pages/Dashboard.tsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Clock,
  Calendar,
  Search,
  Plus,
  ChevronRight,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useDialog } from '../../../context/DialogContext';
import type { Database } from '../../../types/supabase';
import { dashboardService } from '../api/dashboardService';
import DashboardStats from '../components/DashboardStats';
import DashboardAgenda from '../components/DashboardAgenda';
import DashboardNoActivity from '../components/DashboardNoActivity';
import DashboardEmailTracking from '../components/DashboardEmailTracking';
import { TabButton } from '../components/TabButton';
import FeedbackEmailModal from '../../surveys/components/FeedbackEmailModal';
import { FeedbackListItem } from '../../surveys/components/FeedbackListItem';

// --- TIPOS ---
type AgendaItem = Database['public']['Tables']['agenda']['Row'] & {
  leads?: { name: string } | null
};

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

interface EmailTrackingItem {
  id: string;
  lead_id: string | null;
  subject: string;
  status: string;
  opens_count: number;
  first_opened_at: string | null;
  last_opened_at: string | null;
  created_at: string;
  leads?: { name: string, phone: string | null } | null;
}

export default function Dashboard() {
  const { session } = useAuth();
  const { showConfirm, showAlert } = useDialog();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Estados para datos
  const [stats, setStats] = useState<{ totalLeads: number; topSources: SourceStat[] }>({
    totalLeads: 0,
    topSources: []
  });
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);

  // Estado para la búsqueda del cliente y el tab activo
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'hoy' | 'caducadas' | 'semana' | 'correos' | 'feedback'>('hoy');
  const [noActivityLeads, setNoActivityLeads] = useState<RecentLead[]>([]);
  const [emails, setEmails] = useState<EmailTrackingItem[]>([]);
  const [emailFilter, setEmailFilter] = useState<'all' | 'unopened'>('all');
  const [feedbackLeads, setFeedbackLeads] = useState<any[]>([]);
  const [selectedLeadForFeedback, setSelectedLeadForFeedback] = useState<any | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const dateBoundaries = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const dayOfWeek = now.getDay();
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    const endSunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilSunday, 23, 59, 59, 999);

    const next7Days = new Date(startToday.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
    const endW = endSunday.getTime() > next7Days.getTime() ? endSunday : next7Days;

    return {
      startTodayTime: startToday.getTime(),
      endTodayTime: endToday.getTime(),
      endWeekTime: endW.getTime(),
    };
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      loadDashboardData();
    }
  }, [session?.user?.id]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. CARGA DE LEADS Y ESTADÍSTICAS
      const statsData = await dashboardService.getLeadsStats();
      setStats(statsData);

      const recentLeadsData = await dashboardService.getRecentLeads(5);
      setRecentLeads(recentLeadsData);

      // 2. CARGA DE AGENDA
      const agendaData = await dashboardService.getPendingAgenda();
      setAgenda(agendaData);

      // 3. CARGA DE CLIENTES SIN ACTIVIDAD
      const noActivityData = await dashboardService.getNoActivityLeads(50);
      setNoActivityLeads(noActivityData);

      // 4. CARGA DE SEGUIMIENTO DE EMAILS
      const emailData = await dashboardService.getEmailTracking(50);
      setEmails(emailData);

      // 5. CARGA DE LEADS DE OPINIÓN/FEEDBACK
      const feedbackData = await dashboardService.getFeedbackLeads();
      setFeedbackLeads(feedbackData);

    } catch (error) {
      console.error("Error general cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE FILTRADO Y PESTAÑAS ---
  const filteredAgenda = agenda.filter(task => {
    // 1. Filtro por búsqueda de cliente o título
    const matchesSearch =
      task.leads?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Filtro por Tab (Hoy vs Caducadas vs Semana)
    const taskDate = new Date(task.due_date).getTime();

    if (activeTab === 'hoy') {
      return taskDate >= dateBoundaries.startTodayTime && taskDate <= dateBoundaries.endTodayTime;
    }
    if (activeTab === 'caducadas') {
      return taskDate < dateBoundaries.startTodayTime;
    }
    if (activeTab === 'semana') {
      return taskDate >= dateBoundaries.startTodayTime && taskDate <= dateBoundaries.endWeekTime;
    }

    return true;
  });

  const filteredEmails = emails
    .filter(email => {
      const matchesSearch =
        email.leads?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.subject?.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      if (emailFilter === 'unopened') {
        const isOpened = email.status === 'opened' || email.opens_count > 0;
        if (isOpened) return false;
      }

      return true;
    })
    .sort((a, b) => b.opens_count - a.opens_count);

  const todayCount = useMemo(() => agenda.filter(task => {
    if (task.completed) return false;
    const taskDate = new Date(task.due_date).getTime();
    return taskDate >= dateBoundaries.startTodayTime && taskDate <= dateBoundaries.endTodayTime;
  }).length, [agenda, dateBoundaries]);

  const overdueCount = useMemo(() => agenda.filter(task => {
    if (task.completed) return false;
    const taskDate = new Date(task.due_date).getTime();
    return taskDate < dateBoundaries.startTodayTime;
  }).length, [agenda, dateBoundaries]);

  const weekCount = useMemo(() => agenda.filter(task => {
    if (task.completed) return false;
    const taskDate = new Date(task.due_date).getTime();
    return taskDate >= dateBoundaries.startTodayTime && taskDate <= dateBoundaries.endWeekTime;
  }).length, [agenda, dateBoundaries]);

  const unopenedEmailsCount = useMemo(() => {
    return emails.filter(email => {
      const isOpened = email.status === 'opened' || email.opens_count > 0;
      return !isOpened;
    }).length;
  }, [emails]);

  // --- ACCIONES DE LA AGENDA ---
  const toggleTask = async (task: AgendaItem) => {
    const newStatus = !task.completed;
    if (newStatus) {
      setAgenda(prev => prev.filter(t => t.id !== task.id));
    }
    try {
      await dashboardService.toggleAgendaStatus(task.id, newStatus);
    } catch (error) {
      console.error("Error actualizando tarea:", error);
      loadDashboardData();
    }
  };

  const deleteTask = async (id: number) => {
    const confirmed = await showConfirm({
      title: 'Eliminar Tarea',
      message: '¿Estás seguro de que deseas eliminar esta tarea de la agenda?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    });
    if (!confirmed) return;
    setAgenda(prev => prev.filter(t => t.id !== id));
    try {
      await dashboardService.deleteAgendaItem(id);
    } catch (error) {
      console.error("Error eliminando tarea:", error);
      await showAlert({ title: 'Error', message: 'No se pudo eliminar la tarea' });
      loadDashboardData();
    }
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-500 max-w-[1600px] mx-auto w-full gap-6 pb-10">

      {/* CABECERA CON CTAs RÁPIDOS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <LayoutDashboard size={36} className="text-[#006c4a]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Panel de Control</h2>
            <p className="text-slate-500 text-xs font-semibold mt-1">Hola {session?.user.email?.split('@')[0]}, bienvenido de nuevo. Aquí tienes un resumen de la actividad hoy.</p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto self-start md:self-auto">
          <button
            type="button"
            onClick={() => navigate('/agenda?create=true')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Calendar size={16} className="text-slate-500" /> Nueva Tarea
          </button>
          <button
            type="button"
            onClick={() => navigate('/leads?create=true')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#006c4a] text-white font-bold text-xs rounded-lg shadow-md hover:bg-[#005137] transition-all"
          >
            <Plus size={16} /> Nuevo Cliente
          </button>
        </div>
      </div>

      {/* TARJETAS DE MÉTRICAS COMPACTAS */}
      <DashboardStats loading={loading} stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* WIDGET: AGENDA DE ACCIONES */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-[0_4px_6px_-1px_rgb(0,0,0,0.05)] border border-slate-200 overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-6 border-b border-slate-100 flex flex-col gap-4 bg-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Calendar className="text-[#006c4a]" size={18} />
                <h3 className="font-bold text-slate-900 text-sm tracking-tight">Agenda de Acciones</h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('/agenda')}
                className="text-xs font-bold text-[#006c4a] hover:underline transition-all"
              >
                VER CALENDARIO
              </button>
            </div>

            {/* PESTAÑAS (TABS) */}
            <div className="p-1.5 bg-slate-50 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-100">
              <div className="flex bg-white p-1 rounded-lg border border-slate-200 w-fit">
                <TabButton 
                  label="Hoy" 
                  count={todayCount > 0 ? todayCount : undefined} 
                  active={activeTab === 'hoy'} 
                  onClick={() => setActiveTab('hoy')} 
                />
                <TabButton 
                  label="Caducadas" 
                  count={overdueCount} 
                  active={activeTab === 'caducadas'} 
                  onClick={() => setActiveTab('caducadas')} 
                  variant="overdue" 
                />
                <TabButton 
                  label="Esta semana" 
                  count={weekCount > 0 ? weekCount : undefined} 
                  active={activeTab === 'semana'} 
                  onClick={() => setActiveTab('semana')} 
                />
                <TabButton 
                  label="Correos" 
                  count={unopenedEmailsCount} 
                  active={activeTab === 'correos'} 
                  onClick={() => setActiveTab('correos')} 
                  variant="primary" 
                />
                <TabButton 
                  label="Opinión" 
                  count={feedbackLeads.length} 
                  active={activeTab === 'feedback'} 
                  onClick={() => setActiveTab('feedback')} 
                  variant="primary" 
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                {activeTab === 'correos' && (
                  <select
                    value={emailFilter}
                    onChange={(e) => setEmailFilter(e.target.value as 'all' | 'unopened')}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold text-slate-700 bg-white shadow-sm cursor-pointer"
                  >
                    <option value="all">Todos los correos</option>
                    <option value="unopened">Sin abrir</option>
                  </select>
                )}
                <div className="relative flex-1 md:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder={activeTab === 'correos' ? "Buscar por cliente o asunto..." : "Buscar por cliente o tarea..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[500px]">
            {activeTab === 'correos' ? (
              <DashboardEmailTracking
                filteredEmails={filteredEmails}
                searchQuery={searchQuery}
                loading={loading}
                emailFilter={emailFilter}
              />
            ) : activeTab === 'feedback' ? (
              feedbackLeads.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-sm font-bold">¡Todo al día!</p>
                  <p className="text-xs">No hay clientes esperando encuesta de opinión hoy.</p>
                </div>
              ) : (
                <div className="px-6 py-2">
                  {feedbackLeads
                    .filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(lead => (
                      <FeedbackListItem
                        key={lead.id}
                        lead={lead}
                        onSend={() => {
                          setSelectedLeadForFeedback(lead);
                          setIsFeedbackModalOpen(true);
                        }}
                      />
                    ))}
                </div>
              )
            ) : (
              <DashboardAgenda
                filteredAgenda={filteredAgenda}
                searchQuery={searchQuery}
                loading={loading}
                activeTab={activeTab as 'hoy' | 'caducadas' | 'semana'}
                onToggleTask={toggleTask}
                onDeleteTask={deleteTask}
              />
            )}
          </div>
        </div>

        {/* BARRA LATERAL: LEADS Y ACCESOS */}
        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow-[0_4px_6px_-1px_rgb(0,0,0,0.05)] border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-150 flex justify-between items-center bg-white">
              <h3 className="font-bold text-slate-950 text-sm tracking-tight">Clientes Recientes</h3>
              <button type="button" onClick={() => navigate('/leads')} className="text-[10px] font-bold text-slate-500 hover:text-slate-900 uppercase tracking-wider">
                VER TODOS
              </button>
            </div>
            <div className="p-6 space-y-4">
              {recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => navigate(`/leads?search=${encodeURIComponent(lead.name)}`)}
                  className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs border border-slate-200 group-hover:bg-emerald-50 group-hover:text-[#006c4a] group-hover:border-emerald-200 transition-colors">
                      {lead.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs leading-none group-hover:text-[#006c4a] transition-colors">{lead.name}</h4>
                      <span className="text-[10px] text-slate-400 font-medium mt-1 block">{lead.source || 'Sin origen'}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                </div>
              ))}
            </div>
          </div>


        </div>
      </div>

      {selectedLeadForFeedback && (
        <FeedbackEmailModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          lead={selectedLeadForFeedback}
          onSuccess={loadDashboardData}
        />
      )}
    </div>
  );
}