// src/pages/Agenda.tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Loader2,
  Trash2,
  User,
  List
} from 'lucide-react';
import CreateTaskModal from '../components/CreateTaskModal';
import { useDialog } from '../context/DialogContext';
import type { Database } from '../types/supabase';

// Tipo AgendaItem enriquecido con datos del cliente
type AgendaItem = Database['public']['Tables']['agenda']['Row'] & {
  leads?: { name: string } | null
};

const ITEMS_PER_PAGE = 8;

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function Agenda() {
  const { session, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('pending');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCellDate, setSelectedCellDate] = useState<string | undefined>(undefined);
  const { showConfirm, showAlert } = useDialog();

  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('all');

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchAgents();
    }
  }, [profile]);

  const fetchAgents = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');
      if (data) setAgents(data);
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
  };

  useEffect(() => {
    fetchAgenda();

    // Check for "create=true" to open the New Task modal
    if (searchParams.get('create') === 'true') {
      setIsCreateModalOpen(true);
      // Clean up the URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('create');
      setSearchParams(newParams, { replace: true });
    }
  }, [page, filterStatus, viewMode, currentDate, searchParams, setSearchParams, selectedAgentId]);

  const fetchAgenda = async () => {
    if (!session) return;
    setLoading(true);
    try {
      // Consulta a 'agenda' trayendo el nombre del cliente relacionado
      let query = supabase
        .from('agenda')
        .select('*, leads(name)', { count: 'exact' })
        .order('due_date', { ascending: true });

      if (filterStatus === 'pending') query = query.eq('completed', false);
      if (filterStatus === 'completed') query = query.eq('completed', true);

      // Aplicar filtro de usuario/agente
      if (profile?.role === 'admin') {
        if (selectedAgentId !== 'all') {
          query = query.eq('user_id', selectedAgentId);
        }
      } else {
        if (session?.user?.id) {
          query = query.eq('user_id', session.user.id);
        }
      }

      let data, count, error;

      if (viewMode === 'calendar') {
        // Obtenemos un rango amplio que cubra todo el mes visible en el grid
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month - 1, 20).toISOString();
        const lastDay = new Date(year, month + 1, 10).toISOString();
        
        query = query.gte('due_date', firstDay).lte('due_date', lastDay);
        const res = await query;
        data = res.data;
        count = res.count;
        error = res.error;
      } else {
        // Paginado para la lista
        const from = (page - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;
        
        const res = await query.range(from, to);
        data = res.data;
        count = res.count;
        error = res.error;
      }

      if (error) throw error;

      // Mapeamos los datos para asegurar compatibilidad de tipos si leads es array o objeto
      const formattedData = (data || []).map(item => ({
        ...(item as any),
        leads: Array.isArray((item as any).leads) ? (item as any).leads[0] : (item as any).leads
      })) as AgendaItem[];

      setItems(formattedData);
      if (count !== null) setTotalItems(count);

    } catch (error) {
      console.error('Error fetching agenda:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (item: AgendaItem) => {
    const newStatus = !item.completed;
    await (supabase as any).from('agenda').update({ completed: newStatus }).eq('id', item.id);
    fetchAgenda();
  };

  const deleteItem = async (id: number) => {
    const confirmed = await showConfirm({
      title: 'Eliminar Tarea',
      message: '¿Estás seguro de que deseas eliminar esta tarea de la agenda de forma permanente?',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar'
    });
    if (!confirmed) return;
    try {
      const { error } = await supabase.from('agenda').delete().eq('id', id);
      if (error) throw error;
      fetchAgenda();
    } catch (error) {
      await showAlert({ title: 'Error', message: 'No se pudo eliminar la tarea' });
    }
  };

  const getLocalDateString = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getTasksForDate = (dateString: string) => {
    return items.filter(item => getLocalDateString(item.due_date) === dateString);
  };

  const getDaysInMonthGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const startDay = firstDayOfMonth.getDay();
    const offset = startDay === 0 ? 6 : startDay - 1;
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const grid = [];
    
    for (let i = offset; i > 0; i--) {
      const prevDay = daysInPrevMonth - i + 1;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      grid.push({
        day: prevDay,
        month: prevMonth,
        year: prevYear,
        isCurrentMonth: false,
        dateString: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}`
      });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      grid.push({
        day: i,
        month: month,
        year: year,
        isCurrentMonth: true,
        dateString: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      });
    }
    
    const remainingCells = 42 - grid.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      grid.push({
        day: i,
        month: nextMonth,
        year: nextYear,
        isCurrentMonth: false,
        dateString: `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      });
    }
    
    return grid;
  };

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const getTaskEmoji = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('llamada')) return '📞';
    if (t.includes('visita')) return '🏠';
    if (t.includes('whatsapp')) return '🟢';
    if (t.includes('email')) return '📧';
    if (t.includes('reunión')) return '🤝';
    return '📝';
  };

  const getTaskMiniBadgeStyle = (type: string, completed: boolean) => {
    if (completed) return 'bg-slate-100 text-slate-400 line-through border-slate-200 opacity-60';
    const t = type.toLowerCase();
    if (t.includes('llamada')) return 'bg-blue-50 text-blue-700 border-blue-100';
    if (t.includes('visita')) return 'bg-purple-50 text-purple-700 border-purple-100';
    if (t.includes('whatsapp')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (t.includes('email')) return 'bg-amber-50 text-amber-700 border-amber-100';
    if (t.includes('reunión')) return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    return 'bg-slate-50 text-slate-700 border-slate-100';
  };

  const getTypeIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('llamada')) return <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Clock size={18} /></div>;
    if (t.includes('visita')) return <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><CalendarIcon size={18} /></div>;
    if (t.includes('whatsapp')) return <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Smartphone size={18} /></div>;
    if (t.includes('email')) return <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Clock size={18} /></div>;
    if (t.includes('reunión')) return <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><User size={18} /></div>;
    return <div className="p-2 bg-slate-50 text-slate-500 rounded-lg"><AlertCircle size={18} /></div>;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Agenda Global</h1>
            <p className="text-slate-500 text-xs font-medium">Organización y seguimiento de tareas diarias.</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            {/* Selector de Vista */}
            <div className="flex bg-slate-100 rounded-xl p-1 shadow-inner border border-slate-200/50">
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                title="Vista Calendario"
              >
                <CalendarIcon size={16} />
                <span className="hidden sm:inline">Calendario</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                title="Vista Listado"
              >
                <List size={16} />
                <span className="hidden sm:inline">Listado</span>
              </button>
            </div>

            {/* Filtros de Estado */}
            <div className="flex bg-slate-50 rounded-xl border border-slate-200 overflow-hidden p-1 shadow-inner">
              <button
                onClick={() => { setFilterStatus('pending'); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === 'pending' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Pendientes
              </button>
              <button
                onClick={() => { setFilterStatus('completed'); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === 'completed' ? 'bg-white text-emerald-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Completadas
              </button>
              <button
                onClick={() => { setFilterStatus('all'); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === 'all' ? 'bg-white text-slate-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Todas
              </button>
            </div>

            {/* Filtro por Asesor (solo Administradores) */}
            {profile?.role === 'admin' && (
              <select
                value={selectedAgentId}
                onChange={(e) => {
                  setSelectedAgentId(e.target.value);
                  setPage(1);
                }}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
              >
                <option value="all">👥 Todos los asesores</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    👤 {agent.full_name || agent.email}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => { setSelectedCellDate(undefined); setIsCreateModalOpen(true); }}
              className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95 text-xs"
            >
              <Plus size={18} /> Nueva Tarea
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        /* VISTA CALENDARIO */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Navegación del Mes */}
          <div className="flex items-center justify-between p-5 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-sm transition-colors text-slate-600"
              >
                <ChevronLeft size={16} />
              </button>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest min-w-[170px] text-center font-display">
                {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button 
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-sm transition-colors text-slate-600"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shadow-sm transition-all active:scale-95"
            >
              Hoy
            </button>
          </div>

          {/* Cabecera Días de la Semana */}
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {DAYS_OF_WEEK.map(day => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Grid de Celdas */}
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center py-40 text-slate-400 gap-2">
              <Loader2 className="animate-spin text-emerald-600" /> Cargando calendario...
            </div>
          ) : (
            <div className="grid grid-cols-7 border-l border-t border-slate-100 bg-slate-100 gap-[1px]">
              {getDaysInMonthGrid().map((cell, idx) => {
                const cellTasks = getTasksForDate(cell.dateString);
                const isToday = getLocalDateString(new Date().toISOString()) === cell.dateString;
                
                return (
                  <div 
                    key={idx} 
                    className={`min-h-[120px] p-2 flex flex-col group/cell relative transition-all ${cell.isCurrentMonth ? 'bg-white hover:bg-slate-50/30' : 'bg-slate-50/50 text-slate-300'}`}
                  >
                    {/* Celda Header */}
                    <div className="flex justify-between items-center mb-1">
                      {isToday ? (
                        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-md shadow-emerald-500/20">
                          {cell.day}
                        </span>
                      ) : (
                        <span className={`text-xs font-black ${cell.isCurrentMonth ? 'text-slate-700' : 'text-slate-300'}`}>
                          {cell.day}
                        </span>
                      )}
                      
                      <button
                        onClick={() => {
                          setSelectedCellDate(cell.dateString);
                          setIsCreateModalOpen(true);
                        }}
                        className="opacity-0 group-hover/cell:opacity-100 p-1 hover:bg-emerald-50 hover:text-emerald-600 text-slate-400 rounded-md transition-all text-xs font-bold leading-none"
                        title="Añadir tarea para este día"
                      >
                        +
                      </button>
                    </div>
                    
                    {/* Lista de Tareas en Celda */}
                    <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-0.5 max-h-[85px]">
                      {cellTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStatus(task);
                          }}
                          className={`px-1.5 py-1 rounded text-[10px] font-bold border truncate cursor-pointer transition-all flex items-center gap-1 hover:scale-[1.02] shadow-sm select-none ${getTaskMiniBadgeStyle(task.type, task.completed)}`}
                          title={`${task.title} ${task.leads?.name ? `(Cliente: ${task.leads.name})` : ''} ${profile?.role === 'admin' ? `[Asesor: ${agents.find(a => a.id === task.user_id)?.full_name || 'Sin asignar'}]` : ''}`}
                        >
                          <span className="shrink-0">{getTaskEmoji(task.type)}</span>
                          <span className="truncate flex-1">{task.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* VISTA LISTADO */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Próximas Actividades</h3>
            <span className="text-xs font-medium text-slate-400">{totalItems} registros</span>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-slate-400 gap-2">
                <Loader2 className="animate-spin text-emerald-600" /> Cargando...
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
                <p className="font-medium">No hay tareas en esta vista.</p>
              </div>
            ) : (
              items.map((item) => {
                const dateObj = new Date(item.due_date);
                return (
                  <div key={item.id} className={`p-5 flex items-center gap-4 hover:bg-slate-50/50 transition-colors group ${item.completed ? 'opacity-60 bg-slate-50/50' : ''}`}>
                    <button
                      onClick={() => toggleStatus(item)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-emerald-500 text-transparent'}`}
                    >
                      <CheckCircle2 size={14} />
                    </button>

                    {getTypeIcon(item.type)}

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-bold ${item.completed ? 'text-emerald-600 opacity-70' : 'text-slate-800'}`}>
                          {item.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        {item.leads?.name ? (
                          <span className="flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            <User size={12} className="text-emerald-500" /> {item.leads.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Sin cliente vinculado</span>
                        )}
                        {profile?.role === 'admin' && (
                          <span className="flex items-center gap-1 text-slate-700 font-medium bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200" title="Asesor responsable">
                            👤 {agents.find(a => a.id === item.user_id)?.full_name || 'Sin asignar'}
                          </span>
                        )}
                        <span className="flex items-center gap-1 font-medium">
                          <Clock size={12} className="text-slate-400" /> {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-4">
                      <p className="text-sm font-bold text-slate-700">
                        {dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </p>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all active:scale-95"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Paginación (solo listado) */}
          {totalItems > 0 && (
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Página {page} de {totalPages || 1}
              </span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 bg-white border rounded-lg disabled:opacity-50">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 bg-white border rounded-lg disabled:opacity-50">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedCellDate(undefined);
        }}
        onSuccess={() => fetchAgenda()}
        defaultDate={selectedCellDate}
      />
    </div>
  );
}