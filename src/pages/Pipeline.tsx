// src/pages/Pipeline.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronRight, Star } from 'lucide-react';

export default function Pipeline() {
  const [leads, setLeads] = useState<any[]>([]);
  const stages = ['Prospecto', 'Visitando', 'Interés', 'Cierre'];

  useEffect(() => {
    supabase.from('leads').select('*').then(({ data }) => {
      if (data) setLeads(data);
    });
  }, []);

  const moveLead = async (id: string, newStage: string) => {
     // Optimistic update
     setLeads(leads.map(l => l.id === id ? { ...l, stage: newStage } : l));
     await supabase.from('leads').update({ stage: newStage }).eq('id', id);
  };

  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in">
       <h2 className="text-xl font-semibold text-slate-700 uppercase tracking-widest text-sm mb-6">Túnel de Ventas</h2>
       <div className="flex h-full gap-6 overflow-x-auto pb-6">
         {stages.map(stage => (
            <div key={stage} className="flex-1 min-w-[300px] bg-slate-100/50 rounded-3xl flex flex-col border border-slate-200/50">
               <div className="p-4 border-b border-slate-200 bg-white/50 rounded-t-3xl flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{stage}</span>
                  <span className="bg-white px-2 py-1 rounded text-[10px] font-bold">{leads.filter(l => l.stage === stage).length}</span>
               </div>
               <div className="p-4 space-y-4 flex-1 overflow-auto">
                  {leads.filter(l => l.stage === stage).map(lead => (
                     <div key={lead.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 group relative">
                        <Link to={`/leads/${lead.id}`} className="block">
                            <div className="flex justify-between mb-2">
                                <span className="text-[9px] font-bold uppercase text-slate-400">{lead.source}</span>
                                <div className="flex text-amber-400"><Star size={12} fill="currentColor" /><span className="text-[10px] font-bold text-slate-600 ml-1">{lead.rating}</span></div>
                            </div>
                            <p className="font-bold text-slate-800">{lead.firstName} {lead.lastName}</p>
                        </Link>
                        
                        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                            {stage !== 'Prospecto' && <button onClick={() => moveLead(lead.id, stages[stages.indexOf(stage)-1])} className="p-2 bg-slate-50 hover:bg-slate-200 rounded-lg"><ChevronRight className="rotate-180" size={14}/></button>}
                            {stage !== 'Cierre' && <button onClick={() => moveLead(lead.id, stages[stages.indexOf(stage)+1])} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg"><ChevronRight size={14}/></button>}
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         ))}
       </div>
    </div>
  );
}