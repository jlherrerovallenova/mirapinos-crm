// src/pages/LeadDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ChevronRight, 
  Phone, 
  Mail, 
  Send, 
  FileText, 
  CheckCircle2, 
  MessageCircle, 
  X,
  Clock
} from 'lucide-react';

export default function LeadDetail() {
  const { id } = useParams();
  const [lead, setLead] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<any[]>([]); // Guardamos el objeto completo
  const [activeTab, setActiveTab] = useState<'agenda' | 'docs'>('agenda');
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  const loadData = async () => {
    if(!id) return;
    const { data: l } = await supabase.from('leads').select('*').eq('id', id).single();
    const { data: e } = await supabase.from('events').select('*').eq('leadId', id).order('date', { ascending: false });
    const { data: d } = await supabase.from('documents').select('*');
    
    if (l) setLead(l);
    if (e) setEvents(e);
    if (d) setAllDocuments(d);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const logActivity = async (method: string) => {
    const docNames = selectedDocs.map(d => d.name).join(', ');
    const description = `Envío de documentación (${docNames}) vía ${method}`;
    
    await supabase.from('events').insert([{
      leadId: id,
      type: 'Documentación',
      description: description,
      date: new Date().toISOString()
    }]);
    
    loadData(); // Recargar historial
  };

  const handleUpdateStage = async (newStage: string) => {
      const { error } = await supabase.from('leads').update({ stage: newStage }).eq('id', id);
      if (!error) setLead({ ...lead, stage: newStage });
  };

  const toggleDocSelection = (doc: any) => {
    setSelectedDocs(prev => 
      prev.find(d => d.id === doc.id) ? prev.filter(d => d.id !== doc.id) : [...prev, doc]
    );
  };

  const handleSendWhatsApp = async () => {
    const docLinks = selectedDocs.map(d => `${d.name}: ${d.url}`).join('\n');
    const message = `Hola ${lead.firstName}, te adjunto la documentación de Mirapinos:\n\n${docLinks}`;
    
    const encodedMsg = encodeURIComponent(message);
    window.open(`https://wa.me/${lead.phone.replace(/\s+/g, '')}?text=${encodedMsg}`, '_blank');
    
    await logActivity('WhatsApp');
    setIsSendModalOpen(false);
    setSelectedDocs([]);
  };

  const handleSendEmail = async () => {
    const docLinks = selectedDocs.map(d => `• ${d.name}: ${d.url}`).join('\n');
    const subject = "Documentación Solicitada - Mirapinos";
    const body = `Hola ${lead.firstName},\n\nTal como acordamos, te envío los enlaces para descargar la documentación seleccionada:\n\n${docLinks}\n\nQuedo a tu disposición para cualquier duda.\n\nSaludos.`;
    
    window.location.href = `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    await logActivity('Email');
    setIsSendModalOpen(false);
    setSelectedDocs([]);
  };

  if (!lead) return <div className="p-8">Cargando...</div>;

  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in">
       {/* HEADER */}
       <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/leads" className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-slate-800"><ChevronRight className="rotate-180" size={20}/></Link>
            <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter">{lead.firstName} {lead.lastName}</h2>
                <div className="flex gap-4 mt-2 text-sm text-slate-500 font-medium">
                    <span className="flex items-center gap-2 text-pine-600 bg-pine-50 px-3 py-1 rounded-full"><Phone size={14}/> {lead.phone}</span>
                    <span className="flex items-center gap-2 text-pine-600 bg-pine-50 px-3 py-1 rounded-full"><Mail size={14}/> {lead.email}</span>
                </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado:</span>
            <select 
              value={lead.stage}
              onChange={(e) => handleUpdateStage(e.target.value)}
              className="bg-pine-900 text-white px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest cursor-pointer shadow-lg shadow-pine-900/20"
            >
              <option value="Prospecto">Prospecto</option>
              <option value="Visitando">Visitando</option>
              <option value="Interés">Interés</option>
              <option value="Cierre">Cierre</option>
            </select>
          </div>
       </div>
       
       <div className="flex gap-8 flex-1 overflow-hidden">
          {/* PANEL IZQUIERDO */}
          <div className="w-1/4 bg-white p-8 rounded-4xl border border-pine-100 h-full overflow-auto shadow-sm">
             <h3 className="uppercase text-[10px] font-black tracking-[0.2em] text-pine-600 mb-8">Información General</h3>
             <div className="space-y-6">
                <div className="p-4 bg-pine-50 rounded-2xl border border-pine-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Origen del Contacto</span>
                  <p className="font-bold text-slate-800 flex items-center gap-2 capitalize">{lead.source || 'No especificado'}</p>
                </div>
                <div className="p-4 bg-pine-50 rounded-2xl border border-pine-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Registrado el</span>
                  <p className="font-bold text-slate-800">{new Date(lead.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
             </div>
          </div>
          
          {/* PANEL DERECHO: TABS */}
          <div className="flex-1 bg-white rounded-4xl border border-pine-100 h-full flex flex-col overflow-hidden shadow-sm">
             <div className="flex bg-pine-50/50 p-2 m-4 rounded-2xl">
                <button 
                  onClick={() => setActiveTab('agenda')} 
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] uppercase font-black tracking-widest rounded-xl transition-all ${activeTab === 'agenda' ? 'bg-white text-pine-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Clock size={14}/> Historial de Actividad
                </button>
                <button 
                  onClick={() => setActiveTab('docs')} 
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] uppercase font-black tracking-widest rounded-xl transition-all ${activeTab === 'docs' ? 'bg-white text-pine-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Send size={14}/> Enviar Documentos
                </button>
             </div>
             
             <div className="p-8 overflow-auto flex-1">
                {activeTab === 'agenda' ? (
                    <div className="space-y-6">
                        {events.length > 0 ? events.map(e => (
                          <div key={e.id} className="relative pl-8 border-l-2 border-pine-100 pb-6">
                              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-pine-600"></div>
                              <div className="flex justify-between mb-2">
                                  <span className="text-[10px] font-black uppercase text-pine-600 bg-pine-50 px-3 py-1 rounded-lg">{e.type}</span>
                                  <span className="text-[10px] font-bold text-slate-400">{new Date(e.date).toLocaleString()}</span>
                              </div>
                              <p className="font-semibold text-slate-700 text-sm leading-relaxed">{e.description}</p>
                          </div>
                        )) : (
                          <div className="text-center py-20">
                            <p className="text-slate-400 text-sm font-medium italic">No hay actividad registrada aún.</p>
                          </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                        <div className="flex justify-between items-center bg-slate-900 p-6 rounded-3xl text-white shadow-xl shadow-slate-900/10">
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Preparando Envío</p>
                            <h4 className="text-lg font-bold">{selectedDocs.length} documentos seleccionados</h4>
                          </div>
                          <button 
                            disabled={selectedDocs.length === 0}
                            onClick={() => setIsSendModalOpen(true)}
                            className="px-8 py-4 bg-pine-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 disabled:opacity-30 transition-all hover:bg-emerald-500"
                          >
                            <Send size={18}/> Compartir Ahora
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            {allDocuments.map(doc => (
                              <div 
                                key={doc.id} 
                                onClick={() => toggleDocSelection(doc)}
                                className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between group ${
                                  selectedDocs.find(d => d.id === doc.id) ? 'border-pine-600 bg-pine-50/50' : 'border-slate-50 hover:border-pine-100 bg-white'
                                }`}
                              >
                                <div className="flex items-center gap-5">
                                  <div className={`p-4 rounded-2xl transition-all ${selectedDocs.find(d => d.id === doc.id) ? 'bg-pine-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-pine-100 group-hover:text-pine-600'}`}>
                                    <FileText size={24}/>
                                  </div>
                                  <div>
                                    <p className="font-black text-slate-800 text-sm">{doc.name}</p>
                                    <p className="text-[10px] font-black text-pine-600/40 uppercase tracking-[0.15em]">{doc.category}</p>
                                  </div>
                                </div>
                                {selectedDocs.find(d => d.id === doc.id) && <CheckCircle2 className="text-pine-600 animate-in zoom-in" size={24}/>}
                              </div>
                            ))}
                        </div>
                    </div>
                )}
             </div>
          </div>
       </div>

       {/* MODAL DE MÉTODO DE ENVÍO */}
       {isSendModalOpen && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <h3 className="font-poppins font-bold text-xl text-slate-900">Seleccionar Canal</h3>
                <button onClick={() => setIsSendModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"><X size={20}/></button>
              </div>
              <div className="p-10 grid grid-cols-1 gap-4">
                <button 
                  onClick={handleSendWhatsApp}
                  className="flex items-center gap-6 p-6 rounded-3xl bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all group shadow-sm"
                >
                  <div className="p-4 bg-white rounded-2xl group-hover:bg-emerald-500 shadow-sm transition-colors">
                    <MessageCircle size={32} />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-xs uppercase tracking-widest mb-1">WhatsApp</p>
                    <p className="text-[10px] font-medium opacity-70">Envía links directos al chat móvil</p>
                  </div>
                </button>

                <button 
                  onClick={handleSendEmail}
                  className="flex items-center gap-6 p-6 rounded-3xl bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-600 hover:text-white transition-all group shadow-sm"
                >
                  <div className="p-4 bg-white rounded-2xl group-hover:bg-blue-500 shadow-sm transition-colors">
                    <Mail size={32} />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-xs uppercase tracking-widest mb-1">Correo Electrónico</p>
                    <p className="text-[10px] font-medium opacity-70">Abre Outlook con links preparados</p>
                  </div>
                </button>
              </div>
              <div className="p-6 bg-slate-50/50 text-center border-t border-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Se registrará esta acción en el historial</p>
              </div>
           </div>
         </div>
       )}
    </div>
  );
}