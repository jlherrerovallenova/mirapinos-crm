// src/components/leads/LeadDetailModal.tsx
import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Save, Trash2, Loader2, Send, MessageCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import EmailComposerModal from './EmailComposerModal';

export default function LeadDetailModal({ lead, onClose, onUpdate }: any) {
  const [loading, setLoading] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [availableDocs, setAvailableDocs] = useState([]);
  const [sentHistory, setSentHistory] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: lead.name || '',
    email: lead.email || '',
    phone: lead.phone || '',
    status: lead.status || 'new',
    notes: lead.notes || ''
  });

  useEffect(() => {
    fetchDocuments();
    fetchHistory();
  }, [lead.id]);

  async function fetchDocuments() {
    const { data } = await supabase.from('documents').select('name, url');
    if (data) setAvailableDocs(data as any);
  }

  async function fetchHistory() {
    const { data } = await supabase
      .from('sent_documents')
      .select('*')
      .eq('lead_id', lead.id)
      .order('sent_at', { ascending: false });
    if (data) setSentHistory(data);
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.from('leads').update(formData).eq('id', lead.id);
    onUpdate();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          {/* Header y Acciones Rápidas igual que antes */}
          <div className="p-8 pb-4">
            <button onClick={() => setIsEmailModalOpen(true)} className="w-full p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 font-bold flex items-center justify-center gap-2">
              <Send size={18} /> Enviar Nueva Documentación
            </button>
          </div>

          <form onSubmit={handleUpdate} className="px-8 pb-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <input name="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="p-3 bg-slate-50 rounded-xl" placeholder="Nombre" />
              <input name="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="p-3 bg-slate-50 rounded-xl" placeholder="Teléfono" />
            </div>

            {/* Historial de Envíos */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Clock size={14} /> Historial de Documentación Enviada
              </h3>
              <div className="space-y-3">
                {sentHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No se ha enviado documentación aún.</p>
                ) : (
                  sentHistory.map((item) => (
                    <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-700">{item.doc_name}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">
                          {new Date(item.sent_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${item.method === 'whatsapp' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                        {item.method}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl min-h-[100px]" placeholder="Notas de seguimiento..." />

            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-6 py-3 font-bold text-slate-400">Cancelar</button>
              <button type="submit" className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold">Guardar</button>
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