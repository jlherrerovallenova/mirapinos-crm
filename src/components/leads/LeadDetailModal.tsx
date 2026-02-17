// src/components/leads/LeadDetailModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  X, Mail, Phone, Save, Trash2, Loader2, Send, 
  Clock, Compass, MessageCircle, Calendar as CalendarIcon,
  CheckCircle2, Circle, Plus, Pencil, RotateCcw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import EmailComposerModal from './EmailComposerModal';
import type { Database } from '../../types/supabase';

type Lead = Database['public']['Tables']['leads']['Row'];
type AgendaItem = Database['public']['Tables']['agenda']['Row'];

interface Props {
  lead: Lead;
  onClose: () => void;
  onUpdate: () => void;
}

export default function LeadDetailModal({ lead, onClose, onUpdate }: Props) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [availableDocs, setAvailableDocs] = useState<{name: string, url: string}[]>([]);
  const [sentHistory, setSentHistory] = useState<any[]>([]);
  
  // Tareas de la agenda
  const [tasks, setTasks] = useState<AgendaItem[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  
  // Estado local para el formulario de nueva tarea
  const [newTask, setNewTask] = useState({ 
    type: 'Llamada',
    title: '', 
    date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    time: '10:00'
  });

  const [formData, setFormData] = useState({
    name: lead.name || '',
    email: lead.email || '',
    phone: lead.phone || '',
    status: lead.status || 'new',
    source: lead.source || '',
    notes: lead.notes || '',
    company: lead.company || ''
  });

  useEffect(() => {
    fetchDocuments();
    fetchHistory();
    fetchTasks();
  }, [lead.id]);

  async function fetchDocuments() {
    const { data } = await supabase.from('documents').select('name, url').order('created_at', { ascending: false });
    if (data) setAvailableDocs(data);
  }

  async function fetchHistory() {
    const { data } = await supabase.from('sent_documents').select('*').eq('lead_id', lead.id).order('sent_at', { ascending: false });
    if (data) setSentHistory(data);
  }

  // Cargar tareas de la tabla agenda filtrando por ID del lead
  async function fetchTasks() {
    const { data } = await supabase
      .from('agenda')
      .select('*')
      .eq('lead_id', lead.id)
      .order('due_date', { ascending: true });
    
    if (data) setTasks(data);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const saveTask = async () => {
    if (!newTask.title || !session?.user.id) return;

    // Combinar fecha y hora para crear un ISO String
    const dateTimeString = `${newTask.date}T${newTask.time}:00`;
    const finalDate = new Date(dateTimeString).toISOString();

    const taskData = {
      title: newTask.title,
      type: newTask.type,
      due_date: finalDate,
      lead_id: lead.id,          // Vinculación clave con el cliente
      user_id: session.user.id,  // Vinculación clave con el usuario
      completed: false
    };

    try {
      if (editingTaskId) {
        // Editar
        const { error } = await supabase
          .from('agenda')
          .update({
            title: taskData.title,
            type: taskData.type,
            due_date: finalDate
          })
          .eq('id', editingTaskId);
        if (error) throw error;
        setEditingTaskId(null);
      } else {
        // Insertar
        const { error } = await supabase.from('agenda').insert([taskData]);
        if (error) throw error;
      }

      // Reset y recargar
      setNewTask({ type: 'Llamada', title: '', date: new Date().toISOString().slice(0, 10), time: '10:00' });
      fetchTasks();
      
    } catch (error) {
      console.error("Error guardando tarea:", error);
      alert("Error al guardar la tarea.");
    }
  };

  const deleteTask = async (id: number) => {
    if (!window.confirm('¿Eliminar esta tarea?')) return;
    const { error } = await supabase.from('agenda').delete().eq('id', id);
    if (!error) fetchTasks();
  };

  const startEditingTask = (task: AgendaItem) => {
    setEditingTaskId(task.id);
    const dateObj = new Date(task.due_date);
    setNewTask({
      type: task.type,
      title: task.title,
      date: dateObj.toISOString().slice(0, 10),
      time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    });
  };

  const toggleTaskStatus = async (task: AgendaItem) => {
    const newStatus = !task.completed;
    setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: newStatus } : t));
    await supabase.from('agenda').update({ completed: newStatus }).eq('id', task.id);
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
    if (!window.confirm('¿Eliminar este cliente y su agenda?')) return;
    setLoading(true);
    // Borrar tareas asociadas primero (por seguridad, si no hay cascade)
    await supabase.from('agenda').delete().eq('lead_id', lead.id);
    await supabase.from('leads').delete().eq('id', lead.id);
    onUpdate();
    onClose();
  };

  // URLs rápidas
  const cleanPhone = formData.phone.replace(/\D/g, '');
  const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : '#';
  const mailtoUrl = formData.email ? `mailto:${formData.email}?subject=Información%20Finca%20Mirapinos` : '#';

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
          
          {/* HEADER */}
          <div className="px-8 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-800 rounded-xl flex items-center justify-center font-bold text-xl shadow-inner">
                {formData.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">Ficha del Cliente</h2>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-slate-500 font-medium">{formData.name}</p>
                  <div className="flex gap-2 ml-2">
                    {formData.phone && (
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors shadow-sm" title="WhatsApp">
                        <MessageCircle size={14} />
                      </a>
                    )}
                    {formData.email && (
                      <a href={mailtoUrl} className="p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-sm" title="Email">
                        <Mail size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
              <X size={20} />
            </button>
          </div>

          {/* CONTENIDO PRINCIPAL */}
          <div className="flex-1 overflow-y-auto p-8 bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
              
              {/* COLUMNA IZQUIERDA: FORMULARIO */}
              <div className="space-y-6 flex flex-col h-full">
                <button 
                  onClick={() => setIsEmailModalOpen(true)}
                  className="w-full p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all active:scale-95"
                >
                  <Send size={18} /> Enviar Documentación (WhatsApp / Email)
                </button>

                <form onSubmit={handleUpdate} className="space-y-5 flex-1 overflow-y-auto pr-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Bloque 1 */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="w-full mt-1 px-4 py-2.5 bg-slate-50 rounded-lg outline-none text-sm font-bold border border-transparent focus:bg-white focus:border-emerald-500 transition-all" required />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                        <input name="email" value={formData.email} onChange={handleChange} className="w-full mt-1 px-4 py-2.5 bg-slate-50 rounded-lg outline-none text-sm font-medium border border-transparent focus:bg-white focus:border-emerald-500 transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Origen</label>
                        <div className="relative">
                          <Compass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input name="source" value={formData.source} onChange={handleChange} placeholder="Web, Insta..." className="w-full mt-1 pl-10 pr-4 py-2.5 bg-slate-50 rounded-lg outline-none text-sm font-medium border border-transparent focus:bg-white focus:border-emerald-500 transition-all" />
                        </div>
                      </div>
                    </div>

                    {/* Bloque 2 */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="w-full mt-1 px-4 py-2.5 bg-slate-50 rounded-lg outline-none text-sm font-bold text-emerald-600 border border-transparent focus:bg-white focus:border-emerald-500 cursor-pointer">
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
                          <input name="phone" value={formData.phone} onChange={handleChange} placeholder="600..." className="w-full mt-1 pl-10 pr-4 py-2.5 bg-slate-50 rounded-lg outline-none text-sm font-bold border border-transparent focus:bg-white focus:border-emerald-500 transition-all" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alta</label>
                        <div className="relative">
                          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input readOnly value={new Date(lead.created_at).toLocaleDateString()} className="w-full mt-1 pl-10 pr-4 py-2.5 bg-slate-100 rounded-lg outline-none text-sm font-medium text-slate-500 border border-transparent cursor-default" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notas Internas</label>
                    <textarea name="notes" rows={3} value={formData.notes} onChange={handleChange} className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-lg outline-none text-sm font-medium resize-none border border-transparent focus:bg-white focus:border-emerald-500 transition-all" placeholder="Escribe detalles importantes..." />
                  </div>

                  {/* Historial de Documentos */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Clock size={14} /> Documentación Enviada
                    </h3>
                    <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                      {sentHistory.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">No hay envíos registrados.</p>
                      ) : (
                        sentHistory.map((item) => (
                          <div key={item.id} className="bg-white p-2.5 rounded-lg border border-slate-100 flex items-center justify-between shadow-sm">
                            <span className="text-xs font-bold text-slate-700 truncate max-w-[180px]">{item.doc_name}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${item.method === 'whatsapp' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                              {item.method}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button type="button" onClick={handleDelete} className="text-red-500 font-bold text-xs flex items-center gap-2 px-3 py-2 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} /> ELIMINAR LEAD
                    </button>
                    <button type="submit" disabled={loading} className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-lg flex items-center gap-2 shadow-lg hover:bg-slate-800 transition-all active:scale-95">
                      {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} GUARDAR CAMBIOS
                    </button>
                  </div>
                </form>
              </div>

              {/* COLUMNA DERECHA: AGENDA (CONECTADA A LA TABLA AGENDA) */}
              <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col h-full border border-slate-800">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 text-emerald-400">
                  <CalendarIcon size={14} /> Agenda de Acciones
                </h3>
                
                {/* Formulario Inline */}
                <div className="grid grid-cols-1 gap-3 mb-6 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <div className="flex gap-2">
                    <select 
                      value={newTask.type}
                      onChange={(e) => setNewTask({...newTask, type: e.target.value})}
                      className="bg-slate-900 border border-slate-700 rounded-lg text-[11px] font-bold p-2.5 outline-none focus:border-emerald-500 text-slate-200"
                    >
                      <option value="Llamada">Llamada</option>
                      <option value="Email">Email</option>
                      <option value="Visita">Visita</option>
                      <option value="Reunión">Reunión</option>
                    </select>
                    <input 
                      type="date"
                      value={newTask.date}
                      onChange={(e) => setNewTask({...newTask, date: e.target.value})}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg text-[11px] p-2.5 outline-none focus:border-emerald-500 text-slate-200"
                    />
                     <input 
                      type="time"
                      value={newTask.time}
                      onChange={(e) => setNewTask({...newTask, time: e.target.value})}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-lg text-[11px] p-2.5 outline-none focus:border-emerald-500 text-slate-200"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder={editingTaskId ? "Editando tarea..." : "Nueva tarea pendiente..."}
                      value={newTask.title}
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg text-xs p-2.5 outline-none focus:border-emerald-500 text-white placeholder-slate-500"
                    />
                    {editingTaskId && (
                      <button 
                        onClick={() => {
                          setEditingTaskId(null);
                          setNewTask({ type: 'Llamada', title: '', date: new Date().toISOString().slice(0, 10), time: '10:00' });
                        }} 
                        className="bg-slate-700 px-3 rounded-lg hover:bg-slate-600 transition-colors text-slate-300"
                        title="Cancelar edición"
                      >
                        <RotateCcw size={16} />
                      </button>
                    )}
                    <button 
                      onClick={saveTask} 
                      className={`${editingTaskId ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-600 hover:bg-emerald-500'} px-4 rounded-lg transition-colors shadow-lg active:scale-95`}
                    >
                      {editingTaskId ? <Save size={18} /> : <Plus size={18} />}
                    </button>
                  </div>
                </div>

                {/* Lista de Tareas */}
                <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
                  {tasks.length === 0 && (
                    <div className="text-center py-10 opacity-50">
                        <CalendarIcon size={32} className="mx-auto mb-2 text-slate-600" />
                        <p className="text-xs text-slate-400 italic">No hay tareas para este cliente.</p>
                    </div>
                  )}
                  {tasks.map((task) => {
                    const dateObj = new Date(task.due_date);
                    return (
                    <div key={task.id} className={`group flex items-center justify-between p-3 rounded-lg border transition-all ${task.completed ? 'bg-slate-800/30 border-transparent opacity-40' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}>
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleTaskStatus(task)} className="text-emerald-400 hover:scale-110 transition-transform">
                          {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                        </button>
                        <div>
                          <p className={`text-xs font-bold ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>{task.title}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                             {task.type} • {dateObj.toLocaleDateString()} • {dateObj.toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => startEditingTask(task)}
                          className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-blue-400 transition-colors"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={() => deleteTask(task.id)}
                          className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400 transition-colors"
                          title="Borrar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )})}
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