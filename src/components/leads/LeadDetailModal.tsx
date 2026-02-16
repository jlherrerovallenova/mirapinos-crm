// src/components/leads/LeadDetailModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  X, User, Mail, Phone, Save, Trash2, Loader2, Send, 
  Clock, Compass, MessageCircle, Calendar as CalendarIcon,
  CheckCircle, Circle, Plus, AlertCircle, Pencil, RotateCcw
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
  const [agenda, setAgenda] = useState<any[]>([]);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  
  const [newAction, setNewAction] = useState({ 
    type: 'Llamada', 
    title: '', 
    due_date: new Date().toISOString().slice(0, 16) 
  });

  const [formData, setFormData] = useState({
    name: lead.name || '',
    email: lead.email || '',
    phone: lead.phone || '',
    status: lead.status || 'new',
    source: lead.source || '',
    notes: lead.notes || ''
  });

  useEffect(() => {
    fetchDocuments();
    fetchHistory();
    fetchAgenda();
  }, [lead.id]);

  async function fetchDocuments() {
    const { data } = await supabase.from('documents').select('name, url').order('created_at', { ascending: false });
    if (data) setAvailableDocs(data);
  }

  async function fetchHistory() {
    const { data } = await supabase.from('sent_documents').select('*').eq('lead_id', lead.id).order('sent_at', { ascending: false });
    if (data) setSentHistory(data);
  }

  async function fetchAgenda() {
    const { data } = await supabase.from('agenda').select('*').eq('lead_id', lead.id).order('due_date', { ascending: true });
    if (data) setAgenda(data);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addAgendaItem = async () => {
    if (!newAction.title) return;

    if (editingActionId) {
      // Actualizar tarea existente
      const { error } = await supabase
        .from('agenda')
        .update({
          type: newAction.type,
          title: newAction.title,
          due_date: newAction.due_date
        })
        .eq('id', editingActionId);

      if (!error) {
        setEditingActionId(null);
      }
    } else {
      // Crear nueva tarea
      await supabase.from('agenda').insert([{
        lead_id: lead.id,
        ...newAction
      }]);
    }

    setNewAction({ type: 'Llamada', title: '', due_date: new Date().toISOString().slice(0, 16) });
    fetchAgenda();
  };

  const deleteAgendaItem = async (id: string) => {
    if (!window.confirm('¿Eliminar esta tarea de la agenda?')) return;
    const { error } = await supabase.from('agenda').delete().eq('id', id);
    if (!error) fetchAgenda();
  };

  const startEditingTask = (item: any) => {
    setEditingActionId(item.id);
    setNewAction({
      type: item.type,
      title: item.title,
      due_date: new Date(item.due_date).toISOString().slice(0, 16)
    });
  };

  const toggleTask = async (id: string, currentStatus: boolean) => {
    await supabase.from('agenda').update({ completed: !currentStatus }).eq('id', id);
    fetchAgenda();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('leads').update(formData).eq('id', lead.id);
    if (!error) {
      onUpdate();
      onClose();
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar este cliente?')) return;
    setLoading(true);
    await supabase.from('leads').delete().eq('id', lead.id);
    onUpdate();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-6xl rounded-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in duration-200">
          
          <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold text-xl">
                {formData.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">Ficha del Cliente</h2>
                <p className="text-sm text-slate-500 font-medium">{formData.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-md transition-colors text-slate-400">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              <div className="space-y-8">
                <button 
                  onClick={() => setIsEmailModalOpen(true)}
                  className="w-full p-4 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all"
                >
                  <Send size={18} /> Enviar Documentación (WhatsApp / Email)
                </button>

                <form onSubmit={handleUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-lg outline-none text-sm font-bold border border-transparent focus:border-slate-200" required />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                        <input name="email" value={formData.email} onChange={handleChange} className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-lg outline-none text-sm font-medium border border-transparent focus:border-slate-200" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Origen</label>
                        <div className="relative">
                          <Compass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input name="source" value={formData.source} onChange={handleChange} placeholder="Web, Insta..." className="w-full mt-1 pl-10 pr-4 py-3 bg-slate-50 rounded-lg outline-none text-sm font-medium border border-transparent focus:border-slate-200" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-lg outline-none text-sm font-bold text-emerald-600 border border-transparent focus:border-slate-200">
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
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input name="phone" value={formData.phone} onChange={handleChange} placeholder="600..." className="w-full mt-1 pl-10 pr-4 py-3 bg-slate-50 rounded-lg outline-none text-sm font-bold border border-transparent focus:border-slate-200" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha de Alta</label>
                        <div className="relative">
                          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            readOnly 
                            value={new Date(lead.created_at).toLocaleString('es-ES')} 
                            className="w-full mt-1 pl-10 pr-4 py-3 bg-slate-100 rounded-lg outline-none text-sm font-medium text-slate-500 border border-transparent cursor-default" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notas Internas</label>
                    <textarea name="notes" rows={3} value={formData.notes} onChange={handleChange} className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-lg outline-none text-sm font-medium resize-none border border-transparent focus:border-slate-200" />
                  </div>

                  <div className="bg-slate-50 rounded-lg p-6 border border-slate-100">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Clock size={14} /> Documentación Enviada
                    </h3>
                    <div className="space-y-2">
                      {sentHistory.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">No hay envíos registrados.</p>
                      ) : (
                        sentHistory.slice(0, 4).map((item) => (
                          <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700">{item.doc_name}</span>
                            <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase ${item.method === 'whatsapp' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                              {item.method}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <button type="button" onClick={handleDelete} className="text-red-500 font-bold text-xs flex items-center gap-2 px-4 py-2 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={16} /> ELIMINAR LEAD
                    </button>
                    <div className="flex gap-3">
                      <button type="submit" disabled={loading} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-lg flex items-center gap-2 shadow-xl hover:bg-slate-800 transition-all">
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} GUARDAR CAMBIOS
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              <div className="bg-slate-900 rounded-lg p-6 text-white shadow-xl flex flex-col h-full">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 text-emerald-400">
                  <CalendarIcon size={14} /> Agenda de Acciones
                </h3>
                
                <div className="grid grid-cols-1 gap-2 mb-6">
                  <div className="flex gap-2">
                    <select 
                      name="type"
                      value={newAction.type}
                      onChange={(e) => setNewAction({...newAction, type: e.target.value})}
                      className="bg-slate-800 border-none rounded-lg text-[11px] font-bold p-2.5 outline-none"
                    >
                      {['Llamada', 'Email', 'Whatsapp', 'Visita', 'Venta'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input 
                      type="datetime-local"
                      value={newAction.due_date}
                      onChange={(e) => setNewAction({...newAction, due_date: e.target.value})}
                      className="flex-1 bg-slate-800 border-none rounded-lg text-[11px] p-2.5 outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder={editingActionId ? "Editando tarea..." : "Nueva tarea pendiente..."}
                      value={newAction.title}
                      onChange={(e) => setNewAction({...newAction, title: e.target.value})}
                      className="flex-1 bg-slate-800 border-none rounded-lg text-xs p-2.5 outline-none"
                    />
                    {editingActionId && (
                      <button 
                        onClick={() => {
                          setEditingActionId(null);
                          setNewAction({ type: 'Llamada', title: '', due_date: new Date().toISOString().slice(0, 16) });
                        }} 
                        className="bg-slate-700 px-3 rounded-lg hover:bg-slate-600 transition-colors text-slate-300"
                        title="Cancelar edición"
                      >
                        <RotateCcw size={16} />
                      </button>
                    )}
                    <button 
                      onClick={addAgendaItem} 
                      className={`${editingActionId ? 'bg-blue-500 hover:bg-blue-400' : 'bg-emerald-500 hover:bg-emerald-400'} px-4 rounded-lg transition-colors`}
                    >
                      {editingActionId ? <Save size={18} /> : <Plus size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
                  {agenda.length === 0 && <p className="text-[11px] text-slate-500 italic">No hay tareas programadas.</p>}
                  {agenda.map((item) => (
                    <div key={item.id} className={`group flex items-center justify-between p-3 rounded-lg border transition-all ${item.completed ? 'bg-slate-800/30 border-transparent opacity-40' : 'bg-slate-800 border-slate-700'}`}>
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleTask(item.id, item.completed)} className="text-emerald-400 hover:scale-110 transition-transform">
                          {item.completed ? <CheckCircle size={20} /> : <Circle size={20} />}
                        </button>
                        <div>
                          <p className={`text-xs font-bold ${item.completed ? 'line-through' : 'text-white'}`}>{item.title}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{item.type} • {new Date(item.due_date).toLocaleString('es-ES')}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => startEditingTask(item)}
                          className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-blue-400 transition-colors"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={() => deleteAgendaItem(item.id)}
                          className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400 transition-colors"
                          title="Borrar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
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