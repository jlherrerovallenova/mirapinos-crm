// src/pages/Agenda.tsx
import { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MoreVertical, 
  Plus,
  Search,
  Filter
} from 'lucide-react';

export default function Agenda() {
  // Datos de ejemplo (Mock Data)
  const [tasks] = useState([
    { id: 1, title: 'Llamada de seguimiento', contact: 'Juan Pérez', date: 'Hoy', time: '10:30 AM', type: 'call', status: 'pending', priority: 'high' },
    { id: 2, title: 'Visita a propiedad', contact: 'María García', date: 'Hoy', time: '12:00 PM', type: 'visit', status: 'completed', priority: 'medium' },
    { id: 3, title: 'Enviar contrato', contact: 'Roberto Carlos', date: 'Hoy', time: '04:15 PM', type: 'email', status: 'pending', priority: 'low' },
    { id: 4, title: 'Reunión de equipo', contact: 'Staff Mirapinos', date: 'Mañana', time: '09:00 AM', type: 'meeting', status: 'pending', priority: 'medium' },
    { id: 5, title: 'Llamada nuevo lead', contact: 'Ana Torres', date: 'Mañana', time: '11:00 AM', type: 'call', status: 'pending', priority: 'high' },
  ]);

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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-emerald-600 font-bold uppercase tracking-[0.3em] text-[10px] mb-2">Organización</p>
          <h1 className="text-3xl font-display font-bold text-slate-900">Agenda</h1>
        </div>
        <div className="flex gap-3">
           <button className="p-3 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-colors">
            <Search size={20} />
           </button>
           <button className="p-3 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-colors">
            <Filter size={20} />
           </button>
           <button className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2">
            <Plus size={20} /> Nueva Tarea
           </button>
        </div>
      </header>

      {/* Lista de Tareas */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Próximas Actividades</h3>
            <span className="text-xs font-medium text-slate-400">5 tareas pendientes</span>
        </div>
        
        <div className="divide-y divide-slate-100">
            {tasks.map((task) => (
                <div key={task.id} className="p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors group cursor-pointer">
                    {/* Checkbox State */}
                    <button className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-emerald-500'}`}>
                        {task.status === 'completed' && <CheckCircle2 size={14} />}
                    </button>

                    {/* Icono Tipo */}
                    {getTypeIcon(task.type)}

                    {/* Info */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-800">{task.title}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 flex items-center gap-2">
                            {task.contact} <span className="w-1 h-1 rounded-full bg-slate-300"></span> {task.time}
                        </p>
                    </div>

                    {/* Fecha y Acciones */}
                    <div className="text-right">
                        <p className="text-sm font-bold text-slate-700">{task.date}</p>
                        <button className="text-slate-300 hover:text-slate-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical size={18} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}