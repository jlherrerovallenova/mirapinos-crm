// src/components/CreateAppointmentModal.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Calendar, MapPin, Clock, Loader2 } from 'lucide-react';

interface CreateAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateAppointmentModal({ isOpen, onClose, onSuccess }: CreateAppointmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    lead_id: ''
  });

  useEffect(() => {
    if (isOpen) {
      const fetchLeads = async () => {
        // CORRECCIÓN: Seleccionamos 'name' en lugar de campos inexistentes
        const { data } = await supabase
          .from('leads')
          .select('id, name')
          .order('name');
        if (data) setLeads(data);
      };
      fetchLeads();
      setFormData({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        location: '',
        lead_id: ''
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const combinedDateTime = new Date(`${formData.date}T${formData.time}:00`).toISOString();

      const { error } = await supabase.from('appointments').insert([
        {
          title: formData.title,
          date: combinedDateTime,
          location: formData.location,
          lead_id: formData.lead_id || null,
          status: 'pending'
        }
      ]);

      if (error) throw error;
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creando cita:', error);
      alert('Hubo un error al guardar la cita.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800">Nueva Cita</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Título / Motivo</label>
            <input 
              required
              type="text" 
              placeholder="Ej: Visita con Familia García" 
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Fecha</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  required
                  type="date" 
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Hora</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  required
                  type="time" 
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  value={formData.time}
                  onChange={e => setFormData({...formData, time: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ubicación</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Ej: Parcela 24, Oficina, Zoom..." 
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Vincular Cliente (Opcional)</label>
            <select 
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-600"
              value={formData.lead_id}
              onChange={e => setFormData({...formData, lead_id: e.target.value})}
            >
              <option value="">-- Sin vincular --</option>
              {leads.map(lead => (
                <option key={lead.id} value={lead.id}>
                  {lead.name} {/* CORRECCIÓN: Usamos lead.name */}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg transition-colors text-sm"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-lg shadow-emerald-900/20 transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Guardar Cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}