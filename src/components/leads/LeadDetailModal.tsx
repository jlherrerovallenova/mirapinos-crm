// src/components/leads/LeadDetailModal.tsx
import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  BadgeEuro, 
  Tag, 
  FileText,
  Save,
  Trash2,
  Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';

type Lead = Database['public']['Tables']['leads']['Row'];

interface Props {
  lead: Lead;
  onClose: () => void;
  onUpdate: () => void;
}

export default function LeadDetailModal({ lead, onClose, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: lead.name || '',
    email: lead.email || '',
    phone: lead.phone || '',
    company: lead.company || '',
    status: lead.status || 'new',
    value: lead.value || 0,
    notes: lead.notes || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'value' ? parseFloat(value) || 0 : value 
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          status: formData.status as Lead['status'],
          value: formData.value,
          notes: formData.notes
        })
        .eq('id', lead.id);

      if (error) throw error;
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating lead:', error);
      alert('Error al actualizar el lead');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este lead?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', lead.id);

      if (error) throw error;
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Error al eliminar el lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        {/* Header */}
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Detalles del Lead</h2>
              <p className="text-sm text-slate-500">ID: {lead.id.substring(0, 8)}...</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleUpdate} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nombre Completo</label>
                <div className="relative mt-1">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all outline-none text-sm font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Teléfono</label>
                <div className="relative mt-1">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all outline-none text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Clasificación y Valor */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Estado del Proceso</label>
                <div className="relative mt-1">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all outline-none text-sm font-bold appearance-none cursor-pointer"
                  >
                    <option value="new">Nuevo Lead</option>
                    <option value="contacted">Contactado</option>
                    <option value="qualified">Cualificado</option>
                    <option value="proposal">Propuesta Enviada</option>
                    <option value="negotiation">En Negociación</option>
                    <option value="closed">Venta Cerrada</option>
                    <option value="lost">Perdido</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Valor Estimado (€)</label>
                <div className="relative mt-1">
                  <BadgeEuro className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    name="value"
                    type="number"
                    value={formData.value}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all outline-none text-sm font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Empresa</label>
                <div className="relative mt-1">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all outline-none text-sm font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notas de Seguimiento */}
          <div className="mt-6">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Notas de Seguimiento e Historial</label>
            <div className="relative mt-1">
              <FileText className="absolute left-4 top-4 text-slate-400" size={18} />
              <textarea
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                placeholder="Añade detalles sobre la última interacción..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all outline-none text-sm font-medium resize-none"
              />
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-2 text-red-500 font-bold text-sm hover:bg-red-50 px-4 py-2 rounded-xl transition-all"
            >
              <Trash2 size={18} /> Eliminar
            </button>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Guardar Cambios
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}