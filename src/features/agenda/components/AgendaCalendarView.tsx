import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { Database } from '../../../types/supabase';

import type { Profile } from '../../../context/AuthContext';

type AgendaItem = Database['public']['Tables']['agenda']['Row'] & {
  leads?: { name: string } | null
};

interface AgentInfo {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface AgendaCalendarViewProps {
  currentDate: Date;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  items: AgendaItem[];
  loading: boolean;
  agents: AgentInfo[];
  profile: Profile | null;
  onToggleStatus: (item: AgendaItem) => void;
  onSelectCellDate: (dateString: string) => void;
  onOpenCreateModal: () => void;
}

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function AgendaCalendarView({
  currentDate,
  setCurrentDate,
  items,
  loading,
  agents,
  profile,
  onToggleStatus,
  onSelectCellDate,
  onOpenCreateModal
}: AgendaCalendarViewProps) {

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

  return (
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
                      onSelectCellDate(cell.dateString);
                      onOpenCreateModal();
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
                        onToggleStatus(task);
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
  );
}
