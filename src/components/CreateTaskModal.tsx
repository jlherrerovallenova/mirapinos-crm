// src/components/CreateTaskModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Search, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialLeadId?: string;
}

export default function CreateTaskModal({ isOpen, onClose, onSuccess, initialLeadId }: CreateTaskModalProps) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<{ id: string; name: string }[]>([]);
  
  // Estados del formulario
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Llamada');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('10:00');
  const [selectedLeadId, setSelectedLeadId] = useState(initialLeadId || '');
  
  // Estados para el buscador de contactos
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLeads();
      if (initialLeadId) setSelectedLeadId(initialLeadId);
    }
  }, [isOpen, initialLeadId]);

  const fetchLeads = async () => {
    const { data } = await supabase
      .from('leads')
      .select('id, name')
      .order('name', { ascending: true });
    if (data) setLeads(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user.id) return;

    setLoading(true);
    try {
      const fullDateTime = new Date(`${dueDate}T${dueTime}`).toISOString();

      const { error } = await supabase.from('agenda').insert([
        {
          title,
          type,
          due_date: fullDateTime,
          lead_id: selectedLeadId || null,
          user_id: session.user.id,
          completed: false
        }
      ]);

      if (error) throw error;
      
      onSuccess();
      onClose();
      // Limpiar formulario
      setTitle('');
      setSelectedLeadId('');
      setSearchTerm('');
    } catch (error) {
      console.error('Error al crear tarea:', error);
      alert('Error al crear la tarea. Revisa los datos.');
    } finally {
      setLoading(false);
    }
  };

  // Filtrado de clientes para el buscador
  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedLeadName = leads.find(l => l.id === selectedLeadId)?.name || '';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
          <h2 className="text-xl font-bold text-slate-900">Nueva Acción</h2>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Título de la tarea */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Asunto de la acción</label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Llamar para seguimiento"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
            />
          </div>

          {/* Buscador de Contacto Relacionado */}
          <div className="relative">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Contacto Relacionado</label>
            <div className="relative">
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between cursor-pointer hover:border-slate-300 transition-all"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <User size={16} className="text-slate-400 shrink-0" />
                  <span className={`text-sm truncate ${selectedLeadId ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                    {selectedLeadName || 'Seleccionar cliente...'}
                  </span>
                </div>
                <Search size={16} className="text-slate-400 shrink-0" />
              </div>

              {/* Menú Desplegable con Buscador */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl z-[60] overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  <div className="p-2 border-b border-slate-100">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Escribe para buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/10"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredLeads.length > 0 ? (
                      filteredLeads.map((lead) => (
                        <div
                          key={lead.id}
                          onClick={() => {
                            setSelectedLeadId(lead.id);
                            setIsDropdownOpen(false);
                            setSearchTerm('');
                          }}
                          className="px-4 py-2.5 hover:bg-emerald-50 cursor-pointer flex items-center justify-between group transition-colors"
                        >
                          <span className="text-sm text-slate-700 group-hover:text-emerald-700">{lead.name}</span>
                          {selectedLeadId === lead.id && <Check size={14} className="text-emerald-500" />}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-xs text-slate-400 text-center">No se encontraron clientes</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Tipo de Acción */}
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Tipo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm appearance-none bg-white"
              >
                <option value="Llamada">📞 Llamada</option>
                <option value="Visita">🏠 Visita</option>
                <option value="Email">📧 Email</option>
                <option value="Otro">📝 Otro</option>
              </select>
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 text-center">Fecha</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  required
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Hora */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Hora prevista</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                required
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? 'Guardando...' : 'Crear Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}