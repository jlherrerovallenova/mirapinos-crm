// src/components/leads/LeadDetailModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  X, User, Mail, Phone, Save, Trash2, Loader2, Send, 
  Clock, Compass, MessageCircle, Calendar as CalendarIcon,
  CheckCircle, Circle, Plus, AlertCircle, Pencil, RotateCcw
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
    fetchHistory();
    fetchAgenda();
  }, [lead.id]);

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
      // Lógica de edición
      const { error } = await supabase
        .from('agenda')
        .update({
          type: newAction.type,
          title: newAction.title,
          due_date: newAction.due_date
        })
        .eq('id', editingActionId);

      if (!error) setEditingActionId(null);
    } else {
      // Lógica de creación
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

  // Enlaces directos (WhatsApp y Email)
  const cleanPhone = formData.phone.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}`;
  const mailtoUrl = `mailto:${formData.email}?subject=${encodeURIComponent('FINCA MIRAPINOS')}`;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl rounded-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in duration-200">
        
        {/* Cabecera del Modal */}
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold text-xl">
              {formData.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">Ficha del Cliente</h2>
              <div className="flex items-center gap-3">
                <p className="text-sm text-slate-500 font-medium">{formData.name}</p>
                <div className="flex gap-2 ml-2">
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors shadow-sm" title="WhatsApp Directo">
                    <MessageCircle size={14} />
                  </a>
                  <a href={mailtoUrl} className="p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-sm" title="Email Directo">
                    <Mail size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-md transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            <div className="space-y-8">
              {/* Botones de Acción Directa Solicitados */}
              <div className="grid grid-cols-2 gap-4">
                <a 
                  href={whatsappUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-4 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition-all shadow-md"
                >
                  <MessageCircle size={20} /> WhatsApp Directo
                </a>
                <a 
                  href={mailtoUrl}
                  className="flex items-center justify-center gap-2 p-4 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-all shadow-md"
                >
                  <Mail size={20} /> Enviar Email
                </a>
              </div>

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
                        <input readOnly value={new Date(lead.created_at).toLocaleString('es-ES')} className="w-full mt-1 pl-10 pr-4 py-3 bg-slate-100 rounded-lg outline-none text-sm font-medium text-slate-500 border border-transparent cursor-default" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notas Internas</label>
                  <textarea name="notes" rows={3} value={formData.notes} onChange={handleChange} className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-lg outline-none text-sm font-medium resize-none border border-transparent focus:border-slate-200" />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button type="button" onClick={handleDelete} className="text-red-500 font-bold text-xs flex items-center gap-2 px-4 py-2 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 size={16} /> ELIMINAR LEAD
                  </button>
                  <button type="submit" disabled={loading} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-lg flex items-center gap-2 shadow-xl hover:bg-slate-800 transition-all">
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} GUARDAR CAMBIOS
                  </button>
                </div>
              </form>
            </div>

            {/* Panel de Agenda (Completo con Editar y Borrar) */}
            <div className="bg-slate-900 rounded-lg p-6 text-white shadow-xl flex flex-col h-full">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 text-emerald-400">
                <CalendarIcon size={14} /> Agenda de Acciones
              </h3>
              
              <div className="grid grid-cols-1 gap-2 mb-6">
                <div className="flex gap-2">
                  <select name="type" value={newAction.type} onChange={(e) => setNewAction({...newAction, type: e.target.value})} className="bg-slate-800 border-none rounded-lg text-[11px] font-bold p-2.5 outline-none">
                    {['Llamada', 'Email', 'Whatsapp', 'Visita', 'Venta'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input type="datetime-local" value={newAction.due_date} onChange={(e) => setNewAction({...newAction, due_date: e.target.value})} className="flex-1 bg-slate-800 border-none rounded-lg text-[11px] p-2.5 outline-none" />
                </div>
                <div className="flex gap-2">
                  <input type="text" placeholder={editingActionId ? "Editando..." : "Nueva tarea..."} value={newAction.title} onChange={(e) => setNewAction({...newAction, title: e.target.value})} className="flex-1 bg-slate-800 border-none rounded-lg text-xs p-2.5 outline-none" />
                  {editingActionId && (
                    <button onClick={() => { setEditingActionId(null); setNewAction({ type: 'Llamada', title: '', due_date: new Date().toISOString().slice(0, 16) }); }} className="bg-slate-700 px-3 rounded-lg text-slate-300" title="Cancelar edición">
                      <RotateCcw size={16} />
                    </button>
                  )}
                  <button onClick={addAgendaItem} className={`${editingActionId ? 'bg-blue-500' : 'bg-emerald-500'} px-4 rounded-lg transition-colors`}>
                    {editingActionId ? <Save size={18} /> : <Plus size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
                {agenda.length === 0 && <p className="text-[11px] text-slate-500 italic">No hay tareas programadas.</p>}
                {agenda.map((item) => (
                  <div key={item.id} className="group flex items-center justify-between p-3 rounded-lg border bg-slate-800 border-slate-700 transition-all">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleTask(item.id, item.completed)} className="text-emerald-400 hover:scale-110 transition-transform">
                        {item.completed ? <CheckCircle size={20} /> : <Circle size={20} />}
                      </button>
                      <div>
                        <p className={`text-xs font-bold ${item.completed ? 'line-through opacity-40' : 'text-white'}`}>{item.title}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">{item.type} • {new Date(item.due_date).toLocaleString('es-ES')}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEditingTask(item)} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-blue-400" title="Editar"><Pencil size={14} /></button>
                      <button onClick={() => deleteAgendaItem(item.id)} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400" title="Borrar"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}