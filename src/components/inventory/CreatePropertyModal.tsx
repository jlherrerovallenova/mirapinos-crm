import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePropertyModal({ isOpen, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    price: '',
    status: 'Disponible'
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('properties')
        .insert([{
          name: formData.name,
          location: formData.location,
          price: parseFloat(formData.price),
          status: formData.status
        }]);

      if (error) throw error;
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear la propiedad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">Nueva Propiedad</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre del Activo</label>
            <input 
              required
              className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Ej: Villa Nova Residences"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ubicación</label>
            <input 
              required
              className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
              placeholder="Zona, Sector o Dirección"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Precio (€)</label>
              <input 
                required
                type="number"
                className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estado</label>
              <select 
                className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
              >
                <option value="Disponible">Disponible</option>
                <option value="Reservado">Reservado</option>
                <option value="Vendido">Vendido</option>
              </select>
            </div>
          </div>
          
          <button 
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20}/> : 'GUARDAR PROPIEDAD'}
          </button>
        </form>
      </div>
    </div>
  );
}