// src/pages/Leads.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StageBadge } from '../components/Shared';
import { supabase } from '../lib/supabase';
import { Search, Filter, Plus, Eye, X, Loader2 } from 'lucide-react';

export default function Leads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Estado para el nuevo lead
  const [newLead, setNewLead] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    stage: 'Prospecto'
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    setLoading(true);
    const { data, error } = await supabase.from('leads').select('*').order('createdAt', { ascending: false });
    if (!error && data) setLeads(data);
    setLoading(false);
  }

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('leads').insert([newLead]);
    
    if (!error) {
      setIsModalOpen(false);
      setNewLead({ firstName: '', lastName: '', email: '', phone: '', stage: 'Prospecto' });
      fetchLeads();
      alert('Cliente creado con éxito');
    } else {
      alert('Error al crear: ' + error.message);
    }
  };

  const filteredLeads = leads.filter(lead => 
    `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
    lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in">
      <header className="flex justify-between items-center">
        <div>
          <p className="text-pine-600 font-bold uppercase tracking-[0.3em] text-[10px] mb-2">CRM Gestión</p>
          <h1 className="text-4xl font-poppins font-bold text-slate-900 tracking-tight">Clientes</h1>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-4 bg-pine-600 text-white font-bold rounded-2xl shadow-lg shadow-pine-600/20 hover:bg-emerald-500 transition-all text-sm flex items-center gap-2"
        >
          <Plus size={20} /> Crear Cliente
        </button>
      </header>

      {/* MODAL DE CREACIÓN */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-4xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-pine-50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 font-poppins">Nuevo Cliente</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-pine-50 rounded-xl transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateLead} className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input 
                  placeholder="Nombre" required
                  className="w-full p-4 bg-pine-50 rounded-2xl outline-none focus:ring-2 focus:ring-pine-600/20"
                  value={newLead.firstName} onChange={e => setNewLead({...newLead, firstName: e.target.value})}
                />
                <input 
                  placeholder="Apellidos" required
                  className="w-full p-4 bg-pine-50 rounded-2xl outline-none focus:ring-2 focus:ring-pine-600/20"
                  value={newLead.lastName} onChange={e => setNewLead({...newLead, lastName: e.target.value})}
                />
              </div>
              <input 
                placeholder="Email" type="email" required
                className="w-full p-4 bg-pine-50 rounded-2xl outline-none focus:ring-2 focus:ring-pine-600/20"
                value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})}
              />
              <input 
                placeholder="Teléfono" required
                className="w-full p-4 bg-pine-50 rounded-2xl outline-none focus:ring-2 focus:ring-pine-600/20"
                value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})}
              />
              <button className="w-full py-4 bg-pine-900 text-white font-bold rounded-2xl hover:bg-pine-800 transition-all mt-4">
                Guardar Cliente
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TABLA DE LEADS */}
      <div className="bg-white rounded-4xl shadow-sm border border-pine-100 overflow-hidden">
        <div className="p-6 border-b border-pine-50 flex justify-between items-center bg-white">
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-2.5 text-slate-400" size={18} />
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-2.5 bg-pine-50 border-none rounded-xl text-sm w-80 outline-none focus:ring-2 focus:ring-pine-600/10" 
                placeholder="Buscar por nombre o correo..." 
              />
            </div>
          </div>
          <p className="text-xs font-bold text-slate-400">Mostrando {filteredLeads.length} clientes</p>
        </div>

        {loading ? (
          <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-pine-600" size={40}/></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-pine-50/50">
                <th className="px-8 py-5 text-left text-[10px] font-black text-pine-900/40 uppercase tracking-widest">Cliente</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-pine-900/40 uppercase tracking-widest">Estado</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-pine-900/40 uppercase tracking-widest">Teléfono</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-pine-900/40 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pine-50">
              {filteredLeads.map((lead) => (
                <tr 
                  key={lead.id} 
                  onClick={() => navigate(`/leads/${lead.id}`)}
                  className="hover:bg-pine-50/30 transition-colors group cursor-pointer"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-pine-100 rounded-xl flex items-center justify-center text-pine-600 font-bold text-xs">
                        {lead.firstName[0]}{lead.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{lead.firstName} {lead.lastName}</p>
                        <p className="text-xs text-slate-400">{lead.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <StageBadge stage={lead.stage} />
                  </td>
                  <td className="px-8 py-6 text-sm font-medium text-slate-500">
                    {lead.phone}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 text-slate-300 hover:text-pine-600 transition-colors">
                      <Eye size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}