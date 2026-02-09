import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import emailjs from '@emailjs/browser';
import { 
  ChevronRight, Phone, Mail, Send, FileText, 
  CheckCircle2, MessageCircle, X, Loader2, Link as LinkIcon
} from 'lucide-react';

export default function LeadDetail() {
  const { id } = useParams();
  const [lead, setLead] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'agenda' | 'docs'>('agenda');
  
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [isEmailComposerOpen, setIsEmailComposerOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [emailData, setEmailData] = useState({
    subject: 'FINCA MIRAPINOS', 
    body: ''
  });

  const loadData = async () => {
    if(!id) return;
    const { data: l } = await supabase.from('leads').select('*').eq('id', id).single();
    const { data: e } = await supabase.from('events').select('*').eq('leadId', id).order('date', { ascending: false });
    const { data: d } = await supabase.from('documents').select('*').order('id', { ascending: false });
    
    if (l) setLead(l);
    if (e) setEvents(e);
    if (d) setAllDocuments(d);
  };

  useEffect(() => { loadData(); }, [id]);

  const logActivity = async (method: string, detail: string) => {
    await supabase.from('events').insert([{
      leadId: id,
      type: 'Documentación',
      description: `Envío vía ${method}: ${detail}`,
      date: new Date().toISOString()
    }]);
    loadData();
  };

  const toggleDocSelection = (doc: any) => {
    setSelectedDocs(prev => prev.find(d => d.id === doc.id) ? prev.filter(d => d.id !== doc.id) : [...prev, doc]);
  };

  const handleSendWhatsApp = async () => {
    if (selectedDocs.length === 0) return alert("Selecciona al menos un documento.");
    
    // WhatsApp NO soporta HTML, así que aquí mantenemos texto plano
    const docLinks = selectedDocs.map(d => `• ${d.name}: ${d.url}`).join('\n');
    const message = `Hola ${lead.firstName}, desde Finca Mirapinos te adjuntamos la documentación solicitada:\n\n${docLinks}`;
    window.open(`https://wa.me/${lead.phone.replace(/\s+/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    
    await logActivity('WhatsApp', selectedDocs.map(d => d.name).join(', '));
    setIsChannelModalOpen(false);
    setSelectedDocs([]);
  };

  const openEmailComposer = () => {
    setEmailData({
      subject: 'FINCA MIRAPINOS',
      body: `Hola ${lead.firstName},\n\nTal como acordamos, te envío adjunta la documentación sobre Finca Mirapinos.\n\nCualquier duda quedo a tu disposición.\n\nSaludos cordiales.`
    });
    setIsChannelModalOpen(false);
    setIsEmailComposerOpen(true);
  };

  const handleFinalEmailSend = async () => {
    if (!lead.email) return alert("El cliente no tiene email configurado.");
    if (selectedDocs.length === 0) return alert("No hay documentos seleccionados.");
    
    setIsSending(true);

    // --- CAMBIO AQUÍ PARA EMAIL ---
    const linksList = selectedDocs.map(d => 
        `• <a href="${d.url}" target="_blank" style="color: #2563EB; text-decoration: none; font-weight: bold;">${d.name}</a>`
    ).join('\n');
    
    const fullMessage = `${emailData.body}\n\n--------------------------------\nDOCUMENTACIÓN ADJUNTA:\n\n${linksList}\n--------------------------------`;
    // ------------------------------

    const SERVICE_ID = "service_w8zzkn8";
    const TEMPLATE_ID = "template_t3fn5js";
    const PUBLIC_KEY = "UsY6LDpIJtiB91VMI";

    const templateParams = {
        subject: emailData.subject, 
        message: fullMessage,
        message_html: fullMessage,
        to_email: lead.email,
        to_name: `${lead.firstName} ${lead.lastName}`,
        reply_to: 'info@mirapinos.com'
    };
    
    try {
      await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);

      await logActivity('Email App', selectedDocs.map(d => d.name).join(', '));
      alert('¡Email enviado con éxito!');
      setIsEmailComposerOpen(false);
      setSelectedDocs([]);
      setActiveTab('agenda');
    } catch (error: any) {
      console.error("Error EmailJS:", error);
      alert(`Error al enviar el email: ${error?.text || 'Revisa la consola'}`);
    } finally {
      setIsSending(false);
    }
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
       </div>

       <div className="flex gap-8 flex-1 overflow-hidden">
          {/* PANEL IZQUIERDO */}
          <div className="w-1/4 bg-white p-8 rounded-4xl border border-pine-100 h-full overflow-auto shadow-sm">
             <h3 className="uppercase text-[10px] font-black tracking-[0.2em] text-pine-600 mb-8">Info Cliente</h3>
             <div className="space-y-4">
                <div className="p-4 bg-pine-50 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Origen</span>
                  <p className="font-bold text-slate-800">{lead.source || 'Directo'}</p>
                </div>
                <div className="p-4 bg-pine-50 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Estado Actual</span>
                  <p className="font-bold text-pine-600">{lead.stage}</p>
                </div>
             </div>
          </div>

          {/* PANEL DERECHO: TABS */}
          <div className="flex-1 bg-white rounded-4xl border border-pine-100 h-full flex flex-col overflow-hidden shadow-sm">
             <div className="flex bg-pine-50/50 p-2 m-4 rounded-2xl">
                <button onClick={() => setActiveTab('agenda')} className={`flex-1 py-3 text-[10px] uppercase font-black tracking-widest rounded-xl transition-all ${activeTab === 'agenda' ? 'bg-white text-pine-900 shadow-sm' : 'text-slate-400'}`}>Historial</button>
                <button onClick={() => setActiveTab('docs')} className={`flex-1 py-3 text-[10px] uppercase font-black tracking-widest rounded-xl transition-all ${activeTab === 'docs' ? 'bg-white text-pine-900 shadow-sm' : 'text-slate-400'}`}>Documentos</button>
             </div>
             
             <div className="p-8 overflow-auto flex-1">
                {activeTab === 'docs' ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-slate-900 p-6 rounded-3xl text-white">
                      <h4 className="text-lg font-bold">{selectedDocs.length} seleccionados</h4>
                      <button 
                        disabled={selectedDocs.length === 0}
                        onClick={() => setIsChannelModalOpen(true)}
                        className="px-8 py-4 bg-pine-600 text-white rounded-2xl font-black text-xs uppercase hover:bg-emerald-500 disabled:opacity-30"
                      >
                        Enviar Documentos
                      </button>
                    </div>
                    {allDocuments.length === 0 && <p className="text-center text-slate-400 py-10">No hay documentos disponibles.</p>}
                    <div className="grid grid-cols-2 gap-4">
                      {allDocuments.map(doc => (
                        <div key={doc.id} onClick={() => toggleDocSelection(doc)} className={`p-6 rounded-3xl border-2 cursor-pointer flex items-center justify-between transition-all ${selectedDocs.find(d => d.id === doc.id) ? 'border-pine-600 bg-pine-50/50' : 'border-slate-50 bg-white'}`}>
                          <div className="flex items-center gap-5">
                            <div className={`p-4 rounded-2xl ${selectedDocs.find(d => d.id === doc.id) ? 'bg-pine-600 text-white' : 'bg-slate-100 text-slate-400'}`}><FileText size={24}/></div>
                            <p className="font-black text-slate-800 text-sm">{doc.name}</p>
                          </div>
                          {selectedDocs.find(d => d.id === doc.id) && <CheckCircle2 className="text-pine-600" size={24}/>}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {events.map(e => (
                      <div key={e.id} className="relative pl-8 border-l-2 border-pine-100 pb-6">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-pine-600"></div>
                        <span className="text-[10px] font-black uppercase text-pine-600 bg-pine-50 px-3 py-1 rounded-lg">{e.type}</span>
                        <p className="font-semibold text-slate-700 text-sm mt-2">{e.description}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{new Date(e.date).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
       </div>

       {/* MODAL 1: SELECCIÓN DE CANAL */}
       {isChannelModalOpen && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-xl">Enviar Documentación</h3>
                <button onClick={() => setIsChannelModalOpen(false)}><X/></button>
              </div>
              <div className="p-8 space-y-4">
                <button onClick={handleSendWhatsApp} className="w-full flex items-center gap-4 p-6 rounded-3xl bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all">
                  <MessageCircle size={24}/> <span className="font-bold uppercase text-xs">Enviar por WhatsApp</span>
                </button>
                <button onClick={openEmailComposer} className="w-full flex items-center gap-4 p-6 rounded-3xl bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-600 hover:text-white transition-all">
                  <Mail size={24}/> <span className="font-bold uppercase text-xs">Previsualizar Email</span>
                </button>
              </div>
           </div>
         </div>
       )}

       {/* MODAL 2: PREVISUALIZACIÓN Y ENVÍO DE EMAIL */}
       {isEmailComposerOpen && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 flex flex-col max-h-[90vh]">
              {/* Header Modal */}
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50 shrink-0">
                <div>
                  <h3 className="font-bold text-xl text-slate-900">Previsualización del Correo</h3>
                  <p className="text-xs text-slate-500 font-medium">Destinatario: {lead.email}</p>
                </div>
                <button onClick={() => setIsEmailComposerOpen(false)} className="p-2 hover:bg-white rounded-xl transition-colors"><X/></button>
              </div>

              {/* Body Modal (Scrollable) */}
              <div className="p-8 space-y-6 overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asunto (Fijo)</label>
                  <input 
                    className="w-full p-4 bg-slate-100 text-slate-500 rounded-2xl border-none outline-none font-bold cursor-not-allowed"
                    value={emailData.subject}
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mensaje Personalizado</label>
                  <textarea 
                    rows={6}
                    className="w-full p-6 bg-slate-50 rounded-3xl border-none outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-600 text-sm leading-relaxed resize-none"
                    value={emailData.body}
                    onChange={(e) => setEmailData({...emailData, body: e.target.value})}
                  />
                </div>
                
                {/* Bloque Visual de Adjuntos */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Documentación a adjuntar automáticamente</label>
                    <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100">
                        <div className="flex items-center gap-2 mb-3 text-blue-700 font-bold text-xs uppercase border-b border-blue-100 pb-2">
                            <LinkIcon size={14}/> {selectedDocs.length} Enlaces se añadirán al final del correo
                        </div>
                        <ul className="space-y-2">
                            {selectedDocs.map(doc => (
                                <li key={doc.id} className="flex items-center gap-3 text-xs text-slate-600 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                                    <FileText size={14} className="text-blue-400"/>
                                    <span className="font-semibold truncate">{doc.name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <button 
                  onClick={handleFinalEmailSend}
                  disabled={isSending}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 shrink-0"
                >
                  {isSending ? <Loader2 className="animate-spin" size={18}/> : <><Send size={18}/> Enviar Email Definitivo</>}
                </button>
              </div>
           </div>
         </div>
       )}
    </div>
  );
}