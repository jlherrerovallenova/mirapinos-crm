import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void; // Añadido para pasar el error al padre
}

export default function CreateLeadModal({ isOpen, onClose, onSuccess, onError }: CreateLeadModalProps) {
  const [loading, setLoading] = useState(false);
  const [newLead, setNewLead] = useState({
    firstName: '', lastName: '', email: '', phone: '', stage: 'Prospecto', source: 'Web'
  });

  if (!isOpen) return null;

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.from('leads').insert([newLead]);
    
    setLoading(false);

    if (!error) {
      setNewLead({ firstName: '', lastName: '', email: '', phone: '', stage: 'Prospecto', source: 'Web' });
      onSuccess();
      onClose();
    } else {
      // Pasamos el mensaje exacto de Supabase (ej. Violación de restricción única)
      onError(error.message); 
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-pine-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-pine-900 p-10 text-white">
          <h2 className="text-3xl font-poppins font-bold">Nuevo Prospecto</h2>
          <p className="text-pine-300 mt-2">Introduce los datos para el CRM.</p>
        </div>
        
        <form onSubmit={handleCreateLead} className="p-10 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase">Nombre</label>
              <input required className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-pine-600/10" value={newLead.firstName} onChange={e => setNewLead({...newLead, firstName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase">Apellidos</label>
              <input required className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-pine-600/10" value={newLead.lastName} onChange={e => setNewLead({...newLead, lastName: e.target.value})} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase">Email</label>
            <input type="email" required className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-pine-600/10" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase">Teléfono</label>
              <input className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-pine-600/10" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase">Origen</label>
              <select className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-pine-600/10 appearance-none font-bold text-slate-700" value={newLead.source} onChange={e => setNewLead({...newLead, source: e.target.value})}>
                {['Web', 'Instagram', 'Telefónico', 'Referido', 'Portal Inmobiliario', 'Idealista'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          
          <div className="pt-4 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-[2] bg-pine-900 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-pine-800 transition-all flex justify-center items-center">
              {loading ? <Loader2 className="animate-spin" /> : 'CREAR FICHA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}