// src/components/leads/LeadDetailModal.tsx
import React, { useState, useEffect } from 'react';
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
  Loader2,
  Send,
  MessageCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import EmailComposerModal from './EmailComposerModal';
import type { Database } from '../../types/supabase';

type Lead = Database['public']['Tables']['leads']['Row'];

interface Props {
  lead: Lead;
  onClose: () => void;
  onUpdate: () => void;
}

export default function LeadDetailModal({ lead, onClose, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [availableDocs, setAvailableDocs] = useState<{name: string, url: string}[]>([]);
  const [formData, setFormData] = useState({
    name: lead.name || '',
    email: lead.email || '',
    phone: lead.phone || '',
    company: lead.company || '',
    status: lead.status || 'new',
    value: lead.value || 0,
    notes: lead.notes || ''
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('name, url')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setAvailableDocs(data);
    } catch (error) {
      console.error('Error fetching docs:', error);
    }
  }

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
          {/* Header */}
          <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center">
                <User size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Ficha del Cliente</h2>
                <p className="text-sm text-slate-500">Estado actual: <span className="font-bold text-emerald-600 uppercase">{formData.status}</span></p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400">
              <X size={20} />
            </button>
          </div>

          {/* Acciones Rápidas (Nueva Sección) */}
          <div className="px-8 pt-6">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-3 text-emerald-800">
                <Send size={18} className="text-emerald-600" />
                <span className="text-sm font-bold">Enviar Documentación</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setMethod('whatsapp'); setIsEmailModalOpen(true); }}
                  className="px-4 py-2 bg-white text-emerald-600 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2"
                >
                  <MessageCircle size={14} /> WhatsApp
                </button>
                <button 
                  onClick={() => setIsEmailModalOpen(true)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  <Mail size={14} /> Email
                </button>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleUpdate} className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nombre</label>
                  <input name="name" value={formData.name} onChange={handleChange} className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl outline-none text-sm font-medium" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</label>
                  <input name="email" value={formData.email} onChange={handleChange} className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl outline-none text-sm font-medium" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Estado</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl outline-none text-sm font-bold">
                    <option value="new">Nuevo</option>
                    <option value="contacted">Contactado</option>
                    <option value="qualified">Cualificado</option>
                    <option value="proposal">Propuesta</option>
                    <option value="negotiation">Negociación</option>
                    <option value="closed">Cerrado</option>
                    <option value="lost">Perdido</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Valor (€)</label>
                  <input name="value" type="number" value={formData.value} onChange={handleChange} className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl outline-none text-sm font-bold" />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Notas</label>
              <textarea name="notes" rows={3} value={formData.notes} onChange={handleChange} className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl outline-none text-sm font-medium resize-none" />
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
              <button type="button" onClick={handleDelete} className="text-red-500 font-bold text-sm flex items-center gap-2">
                <Trash2 size={18} /> Eliminar Lead
              </button>
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="px-6 py-3 text-slate-500 font-bold text-sm">Cancelar</button>
                <button type="submit" disabled={loading} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Guardar Cambios
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Envío de Email/WhatsApp */}
      {isEmailModalOpen && (
        <EmailComposerModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          leadName={formData.name}
          leadEmail={formData.email}
          leadPhone={formData.phone}
          availableDocs={availableDocs}
        />
      )}
    </>
  );
}