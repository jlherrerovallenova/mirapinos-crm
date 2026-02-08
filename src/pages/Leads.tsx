// src/pages/Leads.tsx
import React, { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import { StageBadge, AppNotification } from '../components/Shared';
import { supabase } from '../lib/supabase';
import { 
  Search, Plus, X, Loader2, Edit2, Trash2, 
  Mail, Phone, Eye, Save, FileText, History, 
  Globe, Check, MessageCircle, Calendar, User
} from 'lucide-react';

// Configuración segura mediante variables de entorno
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_w8zzkn8";
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "template_t3fn5js";
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "UsY6LDpIJtiB91VMI";

export default function Leads() {
  // --- 1. ESTADOS ---
  const [leads, setLeads] = useState<any[]>([]);
  const [availableDocs, setAvailableDocs] = useState<any[]>([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  
  const [notification, setNotification] = useState<{
    show: boolean; title: string; message: string; type: 'success' | 'error' | 'info';
  }>({ show: false, title: '', message: '', type: 'success' });

  const [newLead, setNewLead] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    stage: 'Prospecto',
    source: 'Web'
  });

  const stages = ['Prospecto', 'Visitando', 'Interés', 'Cierre'];
  const sources = ['Web', 'Instagram', 'Telefónico', 'Referido', 'Portal Inmobiliario', 'Idealista'];

  // --- 2. CARGA DE DATOS ---
  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);
    try {
      await Promise.all([
        fetchLeads(),
        fetchDocuments()
      ]);
    } catch (error) {
      console.error("Error cargando datos iniciales:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLeads() {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('createdAt', { ascending: false });
    
    if (!error && data) setLeads(data);
  }

  async function fetchDocuments() {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('name', { ascending: true });
    
    if (!error && data) setAvailableDocs(data);
  }

  // --- 3. LOG DE ACTIVIDAD ---
  const logActivity = async (leadId: string, method: string, docNames: string) => {
    await supabase.from('events').insert([{
      leadId: leadId,
      type: 'Documentación',
      description: `Envío vía ${method}: ${docNames}`,
      date: new Date().toISOString()
    }]);
  };

  // --- 4. FUNCIONES CRUD ---
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('leads').insert([newLead]);
    
    if (!error) {
      setIsModalOpen(false);
      setNewLead({ firstName: '', lastName: '', email: '', phone: '', stage: 'Prospecto', source: 'Web' });
      fetchLeads();
      setNotification({ show: true, title: "ÉXITO", message: "Cliente creado correctamente.", type: 'success' });
    } else {
      setNotification({ show: true, title: "ERROR", message: error.message, type: 'error' });
    }
  };

  const handleSaveEdit = async () => {
    const { error } = await supabase
      .from('leads')
      .update({
        firstName: selectedLead.firstName,
        lastName: selectedLead.lastName,
        email: selectedLead.email,
        phone: selectedLead.phone,
        stage: selectedLead.stage,
        source: selectedLead.source
      })
      .eq('id', selectedLead.id);

    if (!error) {
      setIsEditing(false);
      fetchLeads();
      setNotification({ show: true, title: "ACTUALIZADO", message: "Datos guardados.", type: 'success' });
    } else {
      setNotification({ show: true, title: "ERROR", message: "No se pudo actualizar.", type: 'error' });
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!window.confirm(`¿Estás seguro de eliminar a ${name}?`)) return;
    
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (!error) {
      setSelectedLead(null);
      fetchLeads();
      setNotification({ show: true, title: "ELIMINADO", message: "Cliente eliminado.", type: 'error' });
    }
  };

  // --- 5. LÓGICA DE ENVÍO ---
  const toggleDocSelection = (docId: string) => {
    setSelectedDocs(prev => 
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const handleSendDocs = async (method: 'whatsapp' | 'email') => {
    if (selectedDocs.length === 0) return;
    
    const docsToSend = availableDocs.filter(d => selectedDocs.includes(d.id));
    const docNames = docsToSend.map(d => d.name).join(', ');
    const docLinks = docsToSend.map(d => `${d.name}: ${d.url}`).join('\n');

    if (method === 'whatsapp') {
      const text = `Hola ${selectedLead.firstName}, aquí tienes la documentación solicitada:\n\n${docLinks}`;
      const cleanPhone = selectedLead.phone?.replace(/\s/g, '') || '';
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
      
      await logActivity(selectedLead.id, 'WhatsApp', docNames);
      setNotification({ show: true, title: "WHATSAPP", message: "Chat abierto y actividad registrada.", type: 'success' });
      setSelectedDocs([]);
      return;
    }

    if (method === 'email') {
      setIsSending(true);
      
      const fullMessage = `Hola ${selectedLead.firstName},\n\nAdjunto encontrarás la siguiente documentación solicitada:\n\n${docLinks}\n\nUn saludo,\nEquipo Mirapinos.`;

      try {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            to_name: `${selectedLead.firstName} ${selectedLead.lastName}`,
            to_email: selectedLead.email,
            message: fullMessage,
            reply_to: 'info@mirapinos.com',
          },
          EMAILJS_PUBLIC_KEY
        );

        await logActivity(selectedLead.id, 'Email', docNames);
        setNotification({ 
          show: true, 
          title: "ENVIADO", 
          message: `Correo enviado a ${selectedLead.email} y registrado.`, 
          type: 'success' 
        });
        setSelectedDocs([]);

      } catch (error: any) {
        console.error('Error EmailJS:', error);
        setNotification({ show: true, title: "ERROR", message: "Fallo al enviar el correo.", type: 'error' });
      } finally {
        setIsSending(false);
      }
    }
  };

  const filteredLeads = leads.filter(lead => 
    `${lead.firstName || ''} ${lead.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-pine-600 font-bold uppercase tracking-[0.3em] text-[10px] mb-2">CRM Comercial</p>
          <h1 className="text-4xl font-poppins font-bold text-slate-900 tracking-tight">Cartera de Clientes</h1>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-4 bg-pine-900 text-white font-bold rounded-2xl shadow-xl hover:bg-pine-800 transition-all flex items-center gap-3 active:scale-95"
        >
          <Plus size={20} /> NUEVO PROSPECTO
        </button>
      </header>

      {/* BUSCADOR */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-pine-100 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-pine-600/10 transition-all" 
            placeholder="Buscar por nombre, email o teléfono..." 
          />
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-4xl shadow-sm border border-pine-100 overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-pine-600" size={40}/></div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-pine-50/50 border-b border-pine-50">
                <th className="px-8 py-5 text-left text-[10px] font-black text-pine-900/40 uppercase tracking-widest">Cliente</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-pine-900/40 uppercase tracking-widest">Estado</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-pine-900/40 uppercase tracking-widest hidden md:table-cell">Origen</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-pine-900/40 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pine-50">
              {filteredLeads.map((lead) => (
                <tr 
                  key={lead.id} 
                  onClick={() => { setSelectedLead({...lead}); setIsEditing(false); setSelectedDocs([]); }}
                  className="hover:bg-pine-50/30 transition-colors cursor-pointer group"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white shadow-sm border border-pine-100 rounded-2xl flex items-center justify-center text-pine-600 font-bold uppercase text-lg">
                        {lead.firstName?.[0]}{lead.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{lead.firstName} {lead.lastName}</p>
                        <p className="text-xs text-slate-400 font-medium">{lead.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6"><StageBadge stage={lead.stage} /></td>
                  <td className="px-8 py-6 hidden md:table-cell">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full w-fit">
                      <Globe size={12} className="text-pine-600" />
                      {lead.source || 'Web'}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Eye size={20} className="text-slate-300 ml-auto group-hover:text-pine-600 transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL DETALLE / EDICIÓN */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-pine-900/60 backdrop-blur-md" onClick={() => setSelectedLead(null)}></div>
          <div className="relative bg-white w-full max-w-5xl max-h-[92vh] rounded-[48px] shadow-2xl overflow-y-auto animate-in zoom-in-95 duration-300 border border-white/20">
            
            <div className="bg-pine-900 p-8 md:p-12 text-white flex flex-col md:flex-row justify-between items-start sticky top-0 z-10 shadow-lg">
              <div className="flex-1 w-full">
                {isEditing ? (
                  <div className="space-y-4 w-full md:w-2/3">
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-xl font-bold outline-none focus:bg-white/20 w-full placeholder-white/30 text-white"
                        placeholder="Nombre"
                        value={selectedLead.firstName || ''} 
                        onChange={(e) => setSelectedLead({...selectedLead, firstName: e.target.value})} 
                      />
                      <input 
                        className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-xl font-bold outline-none focus:bg-white/20 w-full placeholder-white/30 text-white"
                        placeholder="Apellidos"
                        value={selectedLead.lastName || ''} 
                        onChange={(e) => setSelectedLead({...selectedLead, lastName: e.target.value})} 
                      />
                    </div>
                    <div className="flex gap-4">
                      <select 
                        className="bg-pine-800 border border-white/20 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                        value={selectedLead.stage}
                        onChange={(e) => setSelectedLead({...selectedLead, stage: e.target.value})}
                      >
                        {stages.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <select 
                        className="bg-pine-800 border border-white/20 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                        value={selectedLead.source}
                        onChange={(e) => setSelectedLead({...selectedLead, source: e.target.value})}
                      >
                        {sources.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-4xl md:text-5xl font-poppins font-bold tracking-tighter mb-2">
                      {selectedLead.firstName} {selectedLead.lastName}
                    </h2>
                    <div className="flex items-center gap-3 mt-2">
                      <StageBadge stage={selectedLead.stage} />
                      <span className="text-pine-300 text-sm font-medium flex items-center gap-1">
                        <Globe size={14} /> {selectedLead.source}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 mt-6 md:mt-0 self-end md:self-start">
                {isEditing ? (
                  <button onClick={handleSaveEdit} className="p-4 bg-emerald-500 hover:bg-emerald-600 rounded-2xl text-white transition-all shadow-lg hover:shadow-emerald-500/30">
                    <Save size={24} />
                  </button>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 text-white transition-all">
                    <Edit2 size={24} />
                  </button>
                )}
                <button onClick={(e) => handleDelete(e, selectedLead.id, selectedLead.firstName)} className="p-4 bg-rose-500/20 hover:bg-rose-500 text-white rounded-2xl border border-rose-500/20 transition-all">
                  <Trash2 size={24} />
                </button>
                <button onClick={() => setSelectedLead(null)} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-8 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-12 bg-white">
              
              <div className="lg:col-span-7 space-y-12">
                <section className="space-y-6">
                  <h3 className="text-xs font-black text-pine-900/30 uppercase tracking-[0.3em] flex items-center gap-2 px-2">
                    <User size={14} /> Información de Contacto
                  </h3>
                  <div className="bg-slate-50/50 border border-pine-50 p-8 rounded-[32px] grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email</p>
                      {isEditing ? (
                        <input className="w-full p-3 bg-white rounded-xl border border-pine-100 outline-none focus:border-pine-400" value={selectedLead.email || ''} onChange={e => setSelectedLead({...selectedLead, email: e.target.value})} />
                      ) : (
                        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.open(`mailto:${selectedLead.email}`)}>
                          <Mail size={16} className="text-pine-400 group-hover:text-pine-600" />
                          <p className="font-bold text-slate-700 truncate group-hover:text-pine-900 transition-colors">{selectedLead.email}</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Teléfono</p>
                      {isEditing ? (
                        <input className="w-full p-3 bg-white rounded-xl border border-pine-100 outline-none focus:border-pine-400" value={selectedLead.phone || ''} onChange={e => setSelectedLead({...selectedLead, phone: e.target.value})} />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-pine-400" />
                          <p className="font-bold text-slate-700">{selectedLead.phone}</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Fecha Registro</p>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-pine-400" />
                        <p className="font-bold text-slate-700">
                          {selectedLead.createdAt ? new Date(selectedLead.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="flex justify-between items-end px-2">
                    <h3 className="text-xs font-black text-pine-900/30 uppercase tracking-[0.3em] flex items-center gap-2">
                      <FileText size={14} /> Envío de Documentación
                    </h3>
                    {selectedDocs.length > 0 && (
                      <span className="text-[10px] font-black text-white bg-pine-600 px-3 py-1 rounded-full animate-in fade-in zoom-in">
                        {selectedDocs.length} seleccionados
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {availableDocs.length === 0 ? (
                      <p className="text-xs text-slate-400 italic p-4">No hay documentos disponibles. Súbelos desde Ajustes.</p>
                    ) : (
                      availableDocs.map(doc => (
                        <div 
                          key={doc.id}
                          onClick={() => toggleDocSelection(doc.id)}
                          className={`
                            flex items-center justify-between p-5 rounded-3xl border transition-all cursor-pointer select-none
                            ${selectedDocs.includes(doc.id) 
                              ? 'bg-pine-900 border-pine-900 text-white shadow-lg shadow-pine-900/20 transform scale-[1.01]' 
                              : 'bg-white border-pine-100 text-slate-600 hover:border-pine-300 hover:bg-slate-50'}
                          `}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl transition-colors ${selectedDocs.includes(doc.id) ? 'bg-white/10' : 'bg-pine-50 text-pine-600'}`}>
                              <FileText size={20} />
                            </div>
                            <span className="font-bold text-sm tracking-tight">{doc.name}</span>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedDocs.includes(doc.id) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200'}`}>
                            {selectedDocs.includes(doc.id) && <Check size={14} strokeWidth={4} />}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <button 
                      onClick={() => handleSendDocs('whatsapp')}
                      disabled={selectedDocs.length === 0}
                      className="flex items-center justify-center gap-3 py-5 bg-emerald-500 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-30 disabled:grayscale shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                      <MessageCircle size={18} /> WhatsApp
                    </button>
                    <button 
                      onClick={() => handleSendDocs('email')}
                      disabled={selectedDocs.length === 0 || isSending}
                      className="flex items-center justify-center gap-3 py-5 bg-pine-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-30 disabled:grayscale shadow-lg shadow-pine-900/20 active:scale-95"
                    >
                      {isSending ? (
                        <>
                           <Loader2 className="animate-spin" size={18} /> Enviando...
                        </>
                      ) : (
                        <>
                           <Mail size={18} /> Enviar Email
                        </>
                      )}
                    </button>
                  </div>
                </section>
              </div>

              <div className="lg:col-span-5 space-y-8">
                <h3 className="text-xs font-black text-pine-900/30 uppercase tracking-[0.3em] flex items-center gap-2 px-2">
                  <History size={14} /> Actividad Reciente
                </h3>
                <div className="relative pl-8 space-y-10 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                  <div className="relative group">
                    <div className="absolute -left-[29px] top-1 w-5 h-5 rounded-full bg-white border-4 border-pine-600 shadow-sm z-10 group-hover:scale-125 transition-transform"></div>
                    <p className="text-[10px] font-black text-pine-600 uppercase tracking-widest mb-1">Sesión Actual</p>
                    <p className="text-sm text-slate-700 font-bold leading-relaxed tracking-tight">Registro abierto en el panel de control.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR CLIENTE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-pine-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
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
                  <select 
                    className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-pine-600/10 appearance-none font-bold text-slate-700" 
                    value={newLead.source} 
                    onChange={e => setNewLead({...newLead, source: e.target.value})}
                  >
                    {sources.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600">Cancelar</button>
                <button type="submit" className="flex-[2] bg-pine-900 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-pine-800 transition-all">CREAR FICHA</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOTIFICACIONES */}
      {notification.show && (
        <AppNotification 
          title={notification.title} 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification({ ...notification, show: false })} 
        />
      )}
    </div>
  );
}