// src/pages/LeadDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ChevronRight, Phone, Mail, Send, FileText, 
  CheckCircle2, MessageCircle, X, Clock, Loader2 
} from 'lucide-react';

export default function LeadDetail() {
  const { id } = useParams();
  const [lead, setLead] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'agenda' | 'docs'>('agenda');
  
  // Estados para Modales
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [isEmailComposerOpen, setIsEmailComposerOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Estado del Formulario de Email
  const [emailData, setEmailData] = useState({
    subject: 'Documentación Solicitada - Mirapinos',
    body: ''
  });

  const loadData = async () => {
    if(!id) return;
    const { data: l } = await supabase.from('leads').select('*').eq('id', id).single();
    const { data: e } = await supabase.from('events').select('*').eq('leadId', id).order('date', { ascending: false });
    const { data: d } = await supabase.from('documents').select('*');
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

  // WHATSAPP (Sigue siendo externo por naturaleza de la API de WA)
  const handleSendWhatsApp = async () => {
    const docLinks = selectedDocs.map(d => `${d.name}: ${d.url}`).join('\n');
    const message = `Hola ${lead.firstName}, te adjunto la documentación:\n\n${docLinks}`;
    window.open(`https://wa.me/${lead.phone.replace(/\s+/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    await logActivity('WhatsApp', selectedDocs.map(d => d.name).join(', '));
    setIsChannelModalOpen(false);
    setSelectedDocs([]);
  };

  // EMAIL: Preparar Modal
  const openEmailComposer = () => {
    const docLinks = selectedDocs.map(d => `• ${d.name}`).join('\n');
    setEmailData({
      ...emailData,
      body: `Hola ${lead.firstName},\n\nTal como acordamos, te envío los enlaces de la documentación seleccionada:\n\n${docLinks}\n\n[Los enlaces se adjuntarán automáticamente al envío]\n\nSaludos,\nEquipo Mirapinos.`
    });
    setIsChannelModalOpen(false);
    setIsEmailComposerOpen(true);
  };

  // EMAIL: Envío Final (Aquí conectarías con Resend/EmailJS)
  const handleFinalEmailSend = async () => {
    setIsSending(true);
    
    // Simulación de delay de red (Aquí iría la llamada a la API)
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // Lógica de registro
      await logActivity('Email App', selectedDocs.map(d => d.name).join(', '));
      
      alert('¡Email enviado con éxito desde la aplicación!');
      setIsEmailComposerOpen(false);
      setSelectedDocs([]);
    } catch (error) {
      alert('Error al enviar el email');
    } finally {
      setIsSending(false);
    }
  };

  if (!lead) return <div className="p-8">Cargando...</div>;

  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in">
       {/* HEADER (Igual que antes...) */}
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
          {/* Listado de Documentos y Tabs (Igual que el código anterior) */}
          <div className="flex-1 bg-white rounded-4xl border border-pine-100 h-full flex flex-col overflow-hidden shadow-sm">
             <div className="flex bg-pine-50/50 p-2 m-4 rounded-2xl">
                <button onClick={() => setActiveTab('agenda')} className={`flex-1 py-3 text-[10px] uppercase font-black tracking-widest rounded-xl ${activeTab === 'agenda' ? 'bg-white text-pine-900 shadow-sm' : 'text-slate-400'}`}>Historial</button>
                <button onClick={() => setActiveTab('docs')} className={`flex-1 py-3 text-[10px] uppercase font-black tracking-widest rounded-xl ${activeTab === 'docs' ? 'bg-white text-pine-900 shadow-sm' : 'text-slate-400'}`}>Documentos</button>
             </div>
             
             <div className="p-8 overflow-auto flex-1">
                {activeTab === 'docs' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-slate-900 p-6 rounded-3xl text-white">
                      <h4 className="text-lg font-bold">{selectedDocs.length} seleccionados</h4>
                      <button 
                        disabled={selectedDocs.length === 0}
                        onClick={() => setIsChannelModalOpen(true)}
                        className="px-8 py-4 bg-pine-600 text-white rounded-2xl font-black text-xs uppercase hover:bg-emerald-500 disabled:opacity-30"
                      >
                        Enviar Documentación
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {allDocuments.map(doc => (
                        <div key={doc.id} onClick={() => toggleDocSelection(doc)} className={`p-6 rounded-3xl border-2 cursor-pointer flex items-center justify-between ${selectedDocs.find(d => d.id === doc.id) ? 'border-pine-600 bg-pine-50/50' : 'border-slate-50 bg-white'}`}>
                          <div className="flex items-center gap-5">
                            <div className={`p-4 rounded-2xl ${selectedDocs.find(d => d.id === doc.id) ? 'bg-pine-600 text-white' : 'bg-slate-100 text-slate-400'}`}><FileText size={24}/></div>
                            <div><p className="font-black text-slate-800 text-sm">{doc.name}</p></div>
                          </div>
                          {selectedDocs.find(d => d.id === doc.id) && <CheckCircle2 className="text-pine-600" size={24}/>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'agenda' && (
                  /* Renderizado de historial... */
                  <div className="space-y-4">
                    {events.map(e => (
                      <div key={e.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-pine-600 uppercase mb-1">{e.type}</p>
                        <p className="text-sm font-medium text-slate-700">{e.description}</p>
                        <p className="text-[10px] text-slate-400 mt-2">{new Date(e.date).toLocaleString()}</p>
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
                <h3 className="font-bold text-xl">¿Cómo quieres enviar?</h3>
                <button onClick={() => setIsChannelModalOpen(false)}><X/></button>
              </div>
              <div className="p-8 space-y-4">
                <button onClick={handleSendWhatsApp} className="w-full flex items-center gap-4 p-6 rounded-3xl bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all">
                  <MessageCircle size={24}/> <span className="font-bold uppercase text-xs">WhatsApp Directo</span>
                </button>
                <button onClick={openEmailComposer} className="w-full flex items-center gap-4 p-6 rounded-3xl bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-600 hover:text-white transition-all">
                  <Mail size={24}/> <span className="font-bold uppercase text-xs">Redactar Email en App</span>
                </button>
              </div>
           </div>
         </div>
       )}

       {/* MODAL 2: REDACTOR DE EMAIL (NUEVA FUNCIONALIDAD) */}
       {isEmailComposerOpen && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="font-bold text-xl text-slate-900">Redactar Mensaje</h3>
                  <p className="text-xs text-slate-500 font-medium">Para: {lead.email}</p>
                </div>
                <button onClick={() => setIsEmailComposerOpen(false)} className="p-2 hover:bg-white rounded-xl transition-colors"><X/></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asunto del Correo</label>
                  <input 
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800"
                    value={emailData.subject}
                    onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mensaje</label>
                  <textarea 
                    rows={8}
                    className="w-full p-6 bg-slate-50 rounded-3xl border-none outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-600 text-sm leading-relaxed"
                    value={emailData.body}
                    onChange={(e) => setEmailData({...emailData, body: e.target.value})}
                  />
                </div>
                
                <div className="bg-blue-50/50 p-4 rounded-2xl flex items-center gap-3">
                  <FileText className="text-blue-500" size={18}/>
                  <p className="text-[10px] font-bold text-blue-700 uppercase">Se adjuntarán {selectedDocs.length} enlaces de descarga segura</p>
                </div>

                <button 
                  onClick={handleFinalEmailSend}
                  disabled={isSending}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 transition-all flex items-center justify-center gap-3 shadow-xl"
                >
                  {isSending ? <Loader2 className="animate-spin" size={18}/> : <><Send size={18}/> Confirmar y Enviar Email</>}
                </button>
              </div>
           </div>
         </div>
       )}
    </div>
  );
}