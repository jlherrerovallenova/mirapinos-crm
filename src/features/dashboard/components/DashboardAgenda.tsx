import { CheckCircle2, Calendar, Circle, AlertCircle, Trash2 } from 'lucide-react';
import type { Database } from '../../../types/supabase';

type AgendaItem = Database['public']['Tables']['agenda']['Row'] & {
  leads?: { name: string } | null
};

interface DashboardAgendaProps {
  filteredAgenda: AgendaItem[];
  searchQuery: string;
  loading: boolean;
  activeTab: 'futuras' | 'caducadas' | 'sinActividad' | 'correos';
  onToggleTask: (task: AgendaItem) => void;
  onDeleteTask: (id: number) => void;
}

export default function DashboardAgenda({
  filteredAgenda,
  searchQuery,
  loading,
  activeTab,
  onToggleTask,
  onDeleteTask
}: DashboardAgendaProps) {

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return isToday ? `Hoy, ${time}` : `${date.toLocaleDateString()} ${time}`;
  };

  if (filteredAgenda.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 animate-in fade-in">
        {activeTab === 'caducadas' ? (
          <>
            <CheckCircle2 size={48} className="mb-4 opacity-30 text-emerald-500" />
            <p className="text-sm font-medium text-slate-600">¡Impecable!</p>
            <p className="text-xs opacity-60">No tienes ninguna tarea vencida.</p>
          </>
        ) : (
          <>
            <Calendar size={48} className="mb-4 opacity-20 text-slate-500" />
            <p className="text-sm font-medium text-slate-600">
              {searchQuery ? 'No hay coincidencias' : 'Todo al día'}
            </p>
            <p className="text-xs opacity-60">
              {searchQuery ? 'Prueba con otro nombre' : 'No tienes acciones futuras pendientes'}
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      {filteredAgenda.map((task) => {
        const isOverdue = new Date(task.due_date) < new Date();
        return (
          <div key={task.id} className="p-4 hover:bg-slate-50 transition-all flex items-center justify-between group bg-white">
            <div className="flex items-center gap-4">
              <button
                onClick={() => onToggleTask(task)}
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all shadow-sm bg-white border border-slate-200 text-slate-300 hover:border-emerald-400 hover:text-emerald-500"
              >
                <Circle size={20} />
              </button>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded border ${
                    task.type === 'Llamada' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    task.type === 'WhatsApp' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    task.type === 'Visita' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                    'bg-slate-50 text-slate-600 border-slate-100'
                  }`}>
                    {task.type}
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {task.leads?.name || 'Sin cliente vinculado'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium">{task.title}</span>
                  <span>•</span>
                  <span className={`${isOverdue ? "text-red-500 font-bold flex items-center gap-1" : ""}`}>
                    {isOverdue && <AlertCircle size={10} />}
                    {formatDateTime(task.due_date)}
                  </span>
                </div>
              </div>
            </div>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onDeleteTask(task.id)}
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
}
