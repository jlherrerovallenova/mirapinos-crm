import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  User,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Loader2,
  AlertCircle,
  Smartphone,
  Calendar as CalendarIcon
} from 'lucide-react';
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

interface AgendaListViewProps {
  items: AgendaItem[];
  loading: boolean;
  totalItems: number;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  agents: AgentInfo[];
  profile: Profile | null;
  onToggleStatus: (item: AgendaItem) => void;
  onDeleteItem: (id: number) => void;
}

export default function AgendaListView({
  items,
  loading,
  totalItems,
  page,
  setPage,
  totalPages,
  agents,
  profile,
  onToggleStatus,
  onDeleteItem
}: AgendaListViewProps) {
  const [expandedTasks, setExpandedTasks] = useState<Record<number, boolean>>({});

  const toggleTaskExpand = (taskId: number) => {
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
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
                  onClick={() => onToggleStatus(item)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-emerald-500 text-transparent'}`}
                >
                  <CheckCircle2 size={14} />
                </button>

                {getTypeIcon(item.type)}

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {(() => {
                      const title = item.title || '';
                      const isEnvio = title.startsWith('Envío Email:') || title.startsWith('Envío WhatsApp:');
                      const colonIndex = title.indexOf(':');

                      if (isEnvio && colonIndex !== -1) {
                        const prefix = title.substring(0, colonIndex + 1);
                        const docs = title.substring(colonIndex + 1).trim();

                        if (docs) {
                          const isExpanded = !!expandedTasks[item.id];
                          return (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-bold ${item.completed ? 'text-emerald-600 opacity-70' : 'text-slate-800'}`}>
                                  {prefix}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTaskExpand(item.id);
                                  }}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-500 font-bold transition-all active:scale-95 border border-slate-200"
                                >
                                  <span>{isExpanded ? 'Ocultar archivos' : 'Ver archivos'}</span>
                                  {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                </button>
                              </div>
                              {isExpanded && (
                                <div className="mt-1 pl-2 border-l-2 border-emerald-500 text-xs text-slate-500 font-medium py-1 animate-in slide-in-from-top-1 duration-200">
                                  <ul className="list-disc list-inside space-y-0.5">
                                    {docs.split(',').map((doc, idx) => (
                                      <li key={idx} className="truncate max-w-md">{doc.trim()}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          );
                        }
                      }

                      return (
                        <span className={`font-bold ${item.completed ? 'text-emerald-600 opacity-70' : 'text-slate-800'}`}>
                          {title}
                        </span>
                      );
                    })()}
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
                    onClick={() => onDeleteItem(item.id)}
                    className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all active:scale-95"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Paginación */}
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
  );
}
