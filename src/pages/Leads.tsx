// src/pages/Leads.tsx
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search, Phone, Mail, Plus, X } from 'lucide-react';
import { StageBadge } from '../components/Shared';

export default function Leads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newLead, setNewLead] = useState({ firstName: '', lastName: '', phone: '', email: '', source: 'Web', stage: 'Prospecto' });

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    const { data } = await supabase.from('leads').select('*').order('createdAt', { ascending: false });
    if (data) setLeads(data);
  }

  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('leads').insert([newLead]);
    if (!error) {
      setIsAddOpen(false);
      fetchLeads();
      setNewLead({ firstName: '', lastName: '', phone: '', email: '', source: 'Web', stage: 'Prospecto' });
    } else {
        alert("Error: " + error.message);
    }
  }

  const filtered = useMemo(() => leads.filter(l => 
    (l.firstName + ' ' + l.lastName).toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [leads, searchTerm]);

  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-700 uppercase tracking-widest text-sm">Gestión de Clientes</h2>
        <button onClick={() => setIsAddOpen(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-emerald-700 transition-colors">
           <Plus size={18} /> Nuevo Cliente
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col flex-1 overflow-hidden">
        <div className="p-5 border-b border-slate-50 flex gap-4 bg-slate-50/50">
           <div className="relative flex-1">
             <Search className="absolute left-4 top-3 text-slate-400" size={18} />
             <input className="w-full pl-12 pr-4 py-2.5 bg-white rounded-2xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-100" placeholder="Buscar por nombre o email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
           </div>
        </div>
        <div className="overflow-auto flex-1">
           <table className="w-full text-left text-sm">
             <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] sticky top-0">
               <tr>
                 <th className="px-8 py-5">Cliente</th>
                 <th className="px-6 py-5">Contacto</th>
                 <th className="px-6 py-5">Etapa</th>
                 <th className="px-6 py-5 text-right">Acciones</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
               {filtered.map(lead => (
                 <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                   <td className="px-8 py-5 font-bold text-slate-800">{lead.firstName} {lead.lastName}</td>
                   <td className="px-6 py-5 text-slate-600">
                      <div className="flex gap-2 items-center"><Phone size={14}/> {lead.phone}</div>
                      <div className="flex gap-2 items-center text-xs mt-1 text-slate-400"><Mail size={14}/> {lead.email}</div>
                   </td>
                   <td className="px-6 py-5"><StageBadge stage={lead.stage} /></td>
                   <td className="px-6 py-5 text-right">
                      <Link to={`/leads/${lead.id}`} className="text-emerald-600 font-bold text-xs uppercase hover:underline">Ver Ficha</Link>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
           <div className="bg-white p-8 rounded-2xl w-[500px] shadow-2xl">
              <div className="flex justify-between mb-6">
                  <h3 className="text-lg font-bold">Nuevo Cliente</h3>
                  <button onClick={() => setIsAddOpen(false)}><X/></button>
              </div>
              <form onSubmit={handleAddLead} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      <input required placeholder="Nombre" className="p-3 bg-slate-50 rounded-xl w-full" value={newLead.firstName} onChange={e => setNewLead({...newLead, firstName: e.target.value})} />
                      <input required placeholder="Apellidos" className="p-3 bg-slate-50 rounded-xl w-full" value={newLead.lastName} onChange={e => setNewLead({...newLead, lastName: e.target.value})} />
                  </div>
                  <input required placeholder="Email" className="p-3 bg-slate-50 rounded-xl w-full" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} />
                  <input required placeholder="Teléfono" className="p-3 bg-slate-50 rounded-xl w-full" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} />
                  <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold mt-4">Guardar</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}