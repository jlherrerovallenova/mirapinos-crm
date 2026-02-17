// src/pages/Agenda.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MoreVertical, 
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Trash2
} from 'lucide-react';
import CreateTaskModal from '../components/CreateTaskModal';
import type { Database } from '../types/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];

const ITEMS_PER_PAGE = 8;

export default function Agenda() {
  const { session } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Paginación y Filtros
  const [page, setPage] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('pending'); // Por defecto ver pendientes
  
  // Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [page, filterStatus]); // Recargar si cambia página o filtro

  const fetchTasks = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('tasks')
        .select('*', { count: 'exact' })
        .eq('user_id', session.user.id) // Solo mis tareas
        .order('due_date', { ascending: true }) // Primero lo más urgente
        .order('due_time', { ascending: true });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, count, error } = await query.range(from, to);

      if (error) throw error;
      if (data) setTasks(data);
      if (count !== null) setTotalTasks(count);

    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    
    // Actualización optimista (UI primero)
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', task.id);

    if (error) {
        console.error('Error updating task', error);
        fetchTasks(); // Revertir si falla
    }
  };

  const deleteTask = async (id: number) => {
      if(!window.confirm('¿Eliminar esta tarea?')) return;
      
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if(!error) fetchTasks();
  };

  const totalPages = Math.ceil(totalTasks / ITEMS_PER_PAGE);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Clock size={18} /></div>;
      case 'visit': return <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CalendarIcon size={18} /></div>;
      default: return <div className="p-2 bg-slate-50 text-slate-500 rounded-lg"><AlertCircle size={18} /></div>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-emerald-600 font-bold uppercase tracking-[0.3em] text-[10px] mb-2">Organización</p>
          <h1 className="text-3xl font-display font-bold text-slate-900">Agenda</h1>
        </div>
        <div className="flex gap-3">
           <div className="flex bg-white rounded-xl border border-slate-200 overflow-hidden p-1">
              <button 
                onClick={() => { setFilterStatus('pending'); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterStatus === 'pending' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Pendientes
              </button>
              <button 
                onClick={() => { setFilterStatus('completed'); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterStatus === 'completed' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Completadas
              </button>
              <button 
                onClick={() => { setFilterStatus('all'); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterStatus === 'all' ? 'bg-slate-100 text-slate-700' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Todas
              </button>
           </div>
           
           <button 
             onClick={() => setIsCreateModalOpen(true)} 
             className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95"
            >
            <Plus size={20} /> <span className="hidden sm:inline">Nueva Tarea</span>
           </button>
        </div>
      </header>

      {/* Lista de Tareas */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Listado de Actividades</h3>
            <span className="text-xs font-medium text-slate-400">{totalTasks} registros encontrados</span>
        </div>
        
        <div className="divide-y divide-slate-100 flex-1">
            {loading ? (
                <div className="flex items-center justify-center h-40 text-slate-400 gap-2">
                    <Loader2 className="animate-spin" /> Cargando agenda...
                </div>
            ) : tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
                    <p className="font-medium">No hay tareas en esta vista.</p>
                </div>
            ) : (
                tasks.map((task) => (
                    <div key={task.id} className={`p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors group ${task.status === 'completed' ? 'opacity-60 bg-slate-50/50' : ''}`}>
                        <button 
                            onClick={() => toggleTaskStatus(task)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-emerald-500 text-transparent'}`}
                        >
                            <CheckCircle2 size={14} />
                        </button>

                        {getTypeIcon(task.type)}

                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`font-bold text-slate-800 ${task.status === 'completed' ? 'line-through text-slate-500' : ''}`}>
                                    {task.title}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 flex items-center gap-2">
                                {task.contact_name || 'Sin contacto'} <span className="w-1 h-1 rounded-full bg-slate-300"></span> {task.due_time?.slice(0,5)}
                            </p>
                        </div>

                        <div className="text-right flex items-center gap-4">
                            <div>
                                <p className="text-sm font-bold text-slate-700">
                                    {new Date(task.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                </p>
                            </div>
                            <button 
                                onClick={() => deleteTask(task.id)}
                                className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                title="Eliminar"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Controles de Paginación */}
        {totalTasks > 0 && (
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                    Página {page} de {totalPages || 1}
                </span>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setPage(1)}
                        disabled={page === 1}
                        className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-500"
                    >
                        <ChevronsLeft size={16} />
                    </button>
                    <button 
                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-500"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button 
                        onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={page >= totalPages}
                        className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-500"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        )}
      </div>

      <CreateTaskModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => { fetchTasks(); }}
      />
    </div>
  );
}