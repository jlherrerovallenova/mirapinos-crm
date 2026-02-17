// src/components/CreateTaskModal.tsx
import { useState } from 'react';
import { X, Loader2, Calendar, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTaskModal({ isOpen, onClose, onSuccess }: Props) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    contact_name: '',
    due_date: new Date().toISOString().split('T')[0], // Hoy por defecto
    due_time: '10:00',
    type: 'call',
    priority: 'medium'
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user.id) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from('tasks').insert([{
        title: formData.title,
        contact_name: formData.contact_name,
        due_date: formData.due_date,
        due_time: formData.due_time,
        type: formData.type as any,
        priority: formData.priority as any,
        user_id: session.user.id,
        status: 'pending'
      }]);

      if (error) throw error;
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        title: '',
        contact_name: '',
        due_date: new Date().toISOString().split('T')[0],
        due_time: '10:00',
        type: 'call',
        priority: 'medium'
      });

    } catch (error) {
      console.error('Error creando tarea:', error);
      alert('Error al guardar la tarea');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900">Nueva Tarea</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título / Acción</label>
            <input 
              required
              type="text" 
              placeholder="Ej. Llamar para confirmar visita"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contacto Relacionado</label>
             <input 
              type="text" 
              placeholder="Ej. Juan Pérez"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
              value={formData.contact_name}
              onChange={e => setFormData({...formData, contact_name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha</label>
                <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                    required
                    type="date" 
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                    value={formData.due_date}
                    onChange={e => setFormData({...formData, due_date: e.target.value})}
                    />
                </div>
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hora</label>
                <div className="relative">
                    <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                    type="time" 
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                    value={formData.due_time}
                    onChange={e => setFormData({...formData, due_time: e.target.value})}
                    />
                </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                <select 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                    <option value="call">Llamada</option>
                    <option value="visit">Visita</option>
                    <option value="email">Email</option>
                    <option value="meeting">Reunión</option>
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prioridad</label>
                <select 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                  value={formData.priority}
                  onChange={e => setFormData({...formData, priority: e.target.value})}
                >
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Baja</option>
                </select>
             </div>
          </div>

          <div className="pt-4 flex gap-3">
             <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Cancelar</button>
             <button type="submit" disabled={loading} className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={20}/> : 'Guardar Tarea'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}