// src/components/leads/LeadDetailModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Tag, 
  Save, 
  Trash2, 
  Loader2, 
  Send, 
  Clock,
  Compass
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
  const [sentHistory, setSentHistory] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: lead.name || '',
    email: lead.email || '',
    phone: lead.phone || '',
    status: lead.status || 'new',
    source: lead.source || '', // Restaurado el origen
    notes: lead.notes || ''
  });

  useEffect(() => {
    fetchDocuments();
    fetchHistory();
  }, [lead.id]);

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

  async function fetchHistory() {
    try {
      const { data, error } = await supabase
        .from('sent_documents')
        .select('*')
        .eq('lead_id', lead.id)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      if (data) setSentHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value 
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
          status: formData.status as Lead['status'],
          source: formData.source, // Guardar el origen
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
        <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
          {/* Header */}
          <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center">
                <User size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Ficha del Cliente</h2>
                <p className="text-sm text-slate-500">Gestión y Seguimiento</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400">
              <X size={20} />
            </button>
          </div>

          {/* Acciones Rápidas */}
          <div className="px-8 pt-6">
            <button 
              onClick={() => setIsEmailModalOpen(true)}
              className="w-full p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
            >
              <Send size={18} /> Enviar Documentación (WhatsApp / Email)
            </button>
          </div>

          {/* Formulario de Datos */}
          <form onSubmit={handleUpdate} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nombre completo</label>
                  <input name="name" value={formData.name} onChange={handleChange} className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl outline-none text-sm font-medium" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Email</label>
                  <input name="email" value={formData.email} onChange={handleChange} className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl outline-none text-sm font-medium" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Origen del Lead</label>
                  <div className="relative">
                    <Compass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      name="source" 
                      value={formData.source} 
                      onChange={handleChange} 
                      placeholder="Ej: Web, Recomendación, Instagram..." 
                      className="w-full mt-1 pl-10 pr-4 py-3 bg-slate-50 rounded-xl outline-none text-sm font-medium" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Estado del Lead</label>
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
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Ej: 600000000" className="w-full mt-1 pl-10 pr-4 py-3 bg-slate-50 rounded-xl outline-none text-sm font-medium" />
                  </div>
                </div>
              </div>
            </div>

            {/* Historial de Documentación */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Clock size={14} /> Historial de Documentos Enviados
              </h3>
              <div className="space-y-2">
                {sentHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No hay registros de envíos previos.</p>
                ) : (
                  sentHistory.map((item) => (
                    <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
                      <div>
                        <p className="text-sm font-bold text-slate-700">{item.doc_name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">
                          {new Date(item.sent_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                        item.method === 'whatsapp' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {item.method}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Notas de Seguimiento</label>
              <textarea name="notes" rows={3} value={formData.notes} onChange={handleChange} className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl outline-none text-sm font-medium resize-none" />
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
              <button type="button" onClick={handleDelete} className="text-red-500 font-bold text-sm flex items-center gap-2 hover:bg-red-50 px-3 py-2 rounded-xl transition-all">
                <Trash2 size={18} /> Eliminar
              </button>
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="px-6 py-3 text-slate-400 font-bold text-sm">Cancelar</button>
                <button type="submit" disabled={loading} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg hover:bg-slate-800 transition-all">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Guardar
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {isEmailModalOpen && (
        <EmailComposerModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          leadId={lead.id}
          leadName={formData.name}
          leadEmail={formData.email}
          leadPhone={formData.phone}
          availableDocs={availableDocs}
          onSentSuccess={fetchHistory}
        />
      )}
    </>
  );
}