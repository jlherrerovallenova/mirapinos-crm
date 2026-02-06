// src/pages/LeadDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronRight, Phone, Mail, Send, FileText, Download } from 'lucide-react';

export default function LeadDetail() {
  const { id } = useParams();
  const [lead, setLead] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'agenda' | 'docs'>('agenda');

  useEffect(() => {
    async function load() {
      if(!id) return;
      const { data: l } = await supabase.from('leads').select('*').eq('id', id).single();
      const { data: e } = await supabase.from('events').select('*').eq('leadId', id).order('date', { ascending: false });
      const { data: d } = await supabase.from('documents').select('*');
      if (l) setLead(l);
      if (e) setEvents(e);
      if (d) setDocuments(d);
    }
    load();
  }, [id]);

  const handleUpdateStage = async (newStage: string) => {
      const { error } = await supabase.from('leads').update({ stage: newStage }).eq('id', id);
      if (!error) setLead({ ...lead, stage: newStage });
  };

  if (!lead) return <div className="p-8">Cargando...</div>;

  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in">
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
          {/* Panel Izquierdo: Perfil */}
          <div className="w-1/3 bg-white p-8 rounded-3xl border border-slate-100 h-full overflow-auto">
             <h3 className="uppercase text-xs font-black tracking-widest text-slate-400 mb-6 border-l-4 border-emerald-500 pl-3">Perfil Cliente</h3>
             <div className="space-y-4">
                <div><span className="text-[10px] uppercase font-bold text-slate-400">Origen</span><p className="font-bold text-slate-800">{lead.source}</p></div>
                <div><span className="text-[10px] uppercase font-bold text-slate-400">Fecha Alta</span><p className="font-bold text-slate-800">{new Date(lead.createdAt).toLocaleDateString()}</p></div>
             </div>
             <div className="mt-8 pt-8 border-t border-slate-50">
                 <label className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Notas</label>
                 <textarea className="w-full h-32 bg-slate-50 rounded-xl p-4 text-sm" placeholder="Escribe notas aquí..."></textarea>
             </div>
          </div>
          
          {/* Panel Derecho: Tabs */}
          <div className="flex-1 bg-white rounded-3xl border border-slate-100 h-full flex flex-col overflow-hidden">
             <div className="flex border-b border-slate-50">
                <button onClick={() => setActiveTab('agenda')} className={`px-8 py-6 text-[10px] uppercase font-black tracking-widest border-b-2 ${activeTab === 'agenda' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400'}`}>Historial</button>
                <button onClick={() => setActiveTab('docs')} className={`px-8 py-6 text-[10px] uppercase font-black tracking-widest border-b-2 ${activeTab === 'docs' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400'}`}>Documentos</button>
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
                    <div className="grid grid-cols-1 gap-4">
                        <div className="p-6 bg-blue-50 rounded-2xl flex items-center justify-between">
                            <div>
                                <p className="font-bold text-blue-900">Enviar Documentación</p>
                                <p className="text-sm text-blue-700">Selecciona archivos para enviar por email a {lead.email}</p>
                            </div>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase flex items-center gap-2"><Send size={14}/> Enviar</button>
                        </div>
                        {/* Aquí podríamos listar documentos enviados */}
                    </div>
                )}
             </div>
          </div>
       </div>
    </div>
  );
}