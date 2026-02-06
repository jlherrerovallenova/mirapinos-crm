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
  Download, 
  CheckCircle2, 
  MessageCircle, 
  X 
} from 'lucide-react';

export default function LeadDetail() {
  const { id } = useParams();
  const [lead, setLead] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'agenda' | 'docs'>('agenda');
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      if(!id) return;
      const { data: l } = await supabase.from('leads').select('*').eq('id', id).single();
      const { data: e } = await supabase.from('events').select('*').eq('leadId', id).order('date', { ascending: false });
      const { data: d } = await supabase.from('documents').select('*');
      
      if (l) setLead(l);
      if (e) setEvents(e);
      if (d) setAllDocuments(d);
    }
    load();
  }, [id]);

  const handleUpdateStage = async (newStage: string) => {
      const { error } = await supabase.from('leads').update({ stage: newStage }).eq('id', id);
      if (!error) setLead({ ...lead, stage: newStage });
  };

  const toggleDocSelection = (url: string) => {
    setSelectedDocs(prev => 
      prev.includes(url) ? prev.filter(d => d !== url) : [...prev, url]
    );
  };

  const handleSendWhatsApp = () => {
    const docNames = allDocuments
      .filter(d => selectedDocs.includes(d.url))
      .map(d => d.name)
      .join(', ');
    
    const message = `Hola ${lead.firstName}, te adjunto la documentación de Mirapinos que solicitaste: ${docNames}. Puedes verlos aquí: ${selectedDocs.join(' ')}`;
    const encodedMsg = encodeURIComponent(message);
    window.open(`https://wa.me/${lead.phone.replace(/\s+/g, '')}?text=${encodedMsg}`, '_blank');
    setIsSendModalOpen(false);
  };

  const handleSendEmail = () => {
    const docNames = allDocuments
      .filter(d => selectedDocs.includes(d.url))
      .map(d => d.name)
      .join(', ');
      
    const subject = encodeURIComponent("Documentación Mirapinos");
    const body = encodeURIComponent(`Hola ${lead.firstName},\n\nAdjuntamos la siguiente documentación:\n${docNames}\n\nSaludos.`);
    
    window.location.href = `mailto:${lead.email}?subject=${subject}&body=${body}`;
    setIsSendModalOpen(false);
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
                    <span className="flex items-center gap-2"><Phone size={14}/> {lead.phone}</span>
                    <span className="flex items-center gap-2"><Mail size={14}/> {lead.email}</span>
                </div>
            </div>
          </div>
          <select 
             value={lead.stage}
             onChange={(e) => handleUpdateStage(e.target.value)}
             className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer"
          >
             <option value="Prospecto">Prospecto</option>
             <option value="Visitando">Visitando</option>
             <option value="Interés">Interés</option>
             <option value="Cierre">Cierre</option>
          </select>
       </div>
       
       <div className="flex gap-8 flex-1 overflow-hidden">
          {/* PANEL IZQUIERDO */}
          <div className="w-1/3 bg-white p-8 rounded-3xl border border-slate-100 h-full overflow-auto">
             <h3 className="uppercase text-xs font-black tracking-widest text-slate-400 mb-6 border-l-4 border-emerald-500 pl-3">Perfil Cliente</h3>
             <div className="space-y-4">
                <div><span className="text-[10px] uppercase font-bold text-slate-400">Origen</span><p className="font-bold text-slate-800">{lead.source}</p></div>
                <div><span className="text-[10px] uppercase font-bold text-slate-400">Fecha Alta</span><p className="font-bold text-slate-800">{new Date(lead.createdAt).toLocaleDateString()}</p></div>
             </div>
          </div>
          
          {/* PANEL DERECHO: TABS */}
          <div className="flex-1 bg-white rounded-3xl border border-slate-100 h-full flex flex-col overflow-hidden">
             <div className="flex border-b border-slate-50">
                <button onClick={() => setActiveTab('agenda')} className={`px-8 py-6 text-[10px] uppercase font-black tracking-widest border-b-2 ${activeTab === 'agenda' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400'}`}>Historial</button>
                <button onClick={() => setActiveTab('docs')} className={`px-8 py-6 text-[10px] uppercase font-black tracking-widest border-b-2 ${activeTab === 'docs' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400'}`}>Enviar Documentos</button>
             </div>
             
             <div className="p-8 overflow-auto flex-1">
                {activeTab === 'agenda' ? (
                    <div className="space-y-6">
                        {events.map(e => (
                        <div key={e.id} className="relative pl-6 border-l-2 border-slate-100">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"></div>
                            <div className="flex justify-between mb-1">
                                <span className="text-[10px] font-bold uppercase bg-slate-100 px-2 rounded text-slate-500">{e.type}</span>
                                <span className="text-[10px] font-bold uppercase text-slate-400">{new Date(e.date).toLocaleString()}</span>
                            </div>
                            <p className="font-medium text-slate-700 text-sm">{e.description}</p>
                        </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center mb-4">
                          <p className="text-sm font-bold text-slate-500">{selectedDocs.length} archivos seleccionados</p>
                          <button 
                            disabled={selectedDocs.length === 0}
                            onClick={() => setIsSendModalOpen(true)}
                            className="px-6 py-3 bg-pine-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-30 transition-all shadow-lg shadow-pine-600/20"
                          >
                            <Send size={16}/> Continuar Envío
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3">
                            {allDocuments.map(doc => (
                              <div 
                                key={doc.id} 
                                onClick={() => toggleDocSelection(doc.url)}
                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                                  selectedDocs.includes(doc.url) ? 'border-pine-600 bg-pine-50/50' : 'border-slate-50 hover:border-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`p-3 rounded-xl ${selectedDocs.includes(doc.url) ? 'bg-pine-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    <FileText size={20}/>
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-800 text-sm">{doc.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{doc.category}</p>
                                  </div>
                                </div>
                                {selectedDocs.includes(doc.url) && <CheckCircle2 className="text-pine-600" size={20}/>}
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
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-4xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-200">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="font-poppins font-bold text-lg">¿Cómo quieres enviar?</h3>
                <button onClick={() => setIsSendModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20}/></button>
              </div>
              <div className="p-8 grid grid-cols-2 gap-4">
                <button 
                  onClick={handleSendWhatsApp}
                  className="flex flex-col items-center gap-4 p-6 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all group"
                >
                  <MessageCircle size={32} />
                  <span className="font-bold text-xs uppercase tracking-widest">WhatsApp</span>
                </button>
                <button 
                  onClick={handleSendEmail}
                  className="flex flex-col items-center gap-4 p-6 rounded-3xl bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white transition-all"
                >
                  <Mail size={32} />
                  <span className="font-bold text-xs uppercase tracking-widest">Email</span>
                </button>
              </div>
              <div className="p-6 bg-slate-50 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Se enviarán {selectedDocs.length} documentos a {lead.firstName}</p>
              </div>
           </div>
         </div>
       )}
    </div>
  );
}