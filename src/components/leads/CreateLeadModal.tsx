// src/components/leads/CreateLeadModal.tsx
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, X, UserPlus } from 'lucide-react';
import { Database } from '../../types/supabase';

type LeadInsert = Database['public']['Tables']['leads']['Insert'];

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export default function CreateLeadModal({ isOpen, onClose, onSuccess, onError }: CreateLeadModalProps) {
  const [loading, setLoading] = useState(false);
  
  // Estado inicial alineado con la DB
  const [newLead, setNewLead] = useState<LeadInsert>({
    name: '', 
    email: '', 
    phone: '', 
    status: 'new', 
    source: 'Web',
    value: 0
  });

  if (!isOpen) return null;

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Inserción directa en Supabase
    const { error } = await supabase.from('leads').insert([newLead]);
    
    setLoading(false);

    if (!error) {
      setNewLead({ name: '', email: '', phone: '', status: 'new', source: 'Web', value: 0 });
      onSuccess();
      onClose();
    } else {
      onError(error.message); 
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-all">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Nuevo Cliente</h2>
              <p className="text-xs text-slate-500">Introduce los datos básicos para el registro.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        {/* FORMULARIO */}
        <form onSubmit={handleCreateLead} className="p-6 space-y-5">
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Nombre Completo <span className="text-red-500">*</span></label>
            <input 
              required 
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              placeholder="Ej. Juan Pérez"
              value={newLead.name} 
              onChange={e => setNewLead({...newLead, name: e.target.value})} 
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Correo Electrónico</label>
            <input 
              type="email" 
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400" 
              placeholder="juan@ejemplo.com"
              value={newLead.email || ''} 
              onChange={e => setNewLead({...newLead, email: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Teléfono</label>
              <input 
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400" 
                placeholder="+34 600..."
                value={newLead.phone || ''} 
                onChange={e => setNewLead({...newLead, phone: e.target.value})} 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Origen</label>
              <select 
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-600" 
                value={newLead.source || 'Web'} 
                onChange={e => setNewLead({...newLead, source: e.target.value})}
              >
                {['Web', 'Instagram', 'Telefónico', 'Referido', 'Portal Inmobiliario', 'Idealista'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-50 mt-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-6 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-emerald-700 focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : 'Guardar Ficha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}