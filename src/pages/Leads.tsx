import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StageBadge, AppNotification } from '../components/Shared';
import { supabase } from '../lib/supabase';
import { 
  Search, Plus, X, Loader2, Globe, Edit2, Trash2, 
  Mail, Phone, Eye, Save
} from 'lucide-react';

export default function Leads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false); // Estado para controlar el modo edición
  
  const [notification, setNotification] = useState<{
    show: boolean; title: string; message: string; type: 'success' | 'error' | 'info';
  }>({ show: false, title: '', message: '', type: 'success' });

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    setLoading(true);
    const { data, error } = await supabase.from('leads').select('*').order('createdAt', { ascending: false });
    if (!error && data) setLeads(data);
    setLoading(false);
  }

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    const { error } = await supabase.from('leads').delete().eq('id', id);
    
    if (!error) {
      setSelectedLead(null);
      fetchLeads();
      setNotification({ show: true, title: "ELIMINADO", message: `${name} ha sido borrado.`, type: 'error' });
    }
  };

  const handleEditToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true); // Activa el formulario de edición
  };

  const handleSaveEdit = async () => {
    const { error } = await supabase
      .from('leads')
      .update({
        firstName: selectedLead.firstName,
        lastName: selectedLead.lastName,
        email: selectedLead.email,
        phone: selectedLead.phone,
        stage: selectedLead.stage
      })
      .eq('id', selectedLead.id);

    if (!error) {
      setIsEditing(false);
      fetchLeads();
      setNotification({ show: true, title: "ACTUALIZADO", message: "Datos guardados correctamente.", type: 'success' });
    }
  };

  const filteredLeads = leads.filter(lead => 
    `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-poppins font-bold text-slate-900 tracking-tight">Clientes</h1>
        </div>
        <button className="px-8 py-4 bg-pine-900 text-white font-bold rounded-2xl flex items-center gap-2 hover:bg-pine-800 transition-all">
          <Plus size={20} /> NUEVO PROSPECTO
        </button>
      </header>

      {/* Tabla de Leads */}
      <div className="bg-white rounded-4xl shadow-sm border border-pine-100 overflow-hidden">
        <div className="p-6 border-b border-pine-50">
          <div className="relative">
            <Search className="absolute left-4 top-2.5 text-slate-400" size={18} />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-2.5 bg-pine-50 border-none rounded-xl text-sm w-80 outline-none focus:ring-2 focus:ring-pine-600/10" 
              placeholder="Buscar cliente..." 
            />
          </div>
        </div>

        {loading ? (
          <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-pine-600" size={40}/></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-pine-50/50">
                <th className="px-8 py-5 text-left text-[10px] font-black text-pine-900/40 uppercase tracking-widest">Cliente</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-pine-900/40 uppercase tracking-widest">Estado</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-pine-900/40 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pine-50">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} onClick={() => { setSelectedLead(lead); setIsEditing(false); }} className="hover:bg-pine-50/30 transition-colors cursor-pointer group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-pine-100 rounded-xl flex items-center justify-center text-pine-600 font-bold">{lead.firstName?.[0]}</div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{lead.firstName} {lead.lastName}</p>
                        <p className="text-xs text-slate-400">{lead.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6"><StageBadge stage={lead.stage} /></td>
                  <td className="px-8 py-6 text-right"><Eye size={20} className="text-slate-300 ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Detalle / Edición */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-pine-900/60 backdrop-blur-sm" onClick={() => setSelectedLead(null)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            
            <div className="bg-pine-900 p-10 text-white flex justify-between items-start">
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <input 
                      className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-2xl font-bold w-full outline-none"
                      value={selectedLead.firstName}
                      onChange={(e) => setSelectedLead({...selectedLead, firstName: e.target.value})}
                    />
                    <input 
                      className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-2xl font-bold w-full outline-none"
                      value={selectedLead.lastName}
                      onChange={(e) => setSelectedLead({...selectedLead, lastName: e.target.value})}
                    />
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-bold mb-4">{selectedLead.firstName?.[0]}</div>
                    <h2 className="text-3xl font-poppins font-bold tracking-tighter">{selectedLead.firstName} {selectedLead.lastName}</h2>
                  </>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                {isEditing ? (
                  <button onClick={handleSaveEdit} className="p-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white transition-all">
                    <Save size={20} />
                  </button>
                ) : (
                  <button onClick={handleEditToggle} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 text-white">
                    <Edit2 size={20} />
                  </button>
                )}
                <button onClick={(e) => handleDelete(e, selectedLead.id, selectedLead.firstName)} className="p-3 bg-rose-500/20 hover:bg-rose-500 text-white rounded-xl border border-rose-500/20"><Trash2 size={20} /></button>
                <button onClick={() => setSelectedLead(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl"><X size={20} /></button>
              </div>
            </div>

            <div className="p-10 bg-slate-50 space-y-6">
              {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase">Email</label>
                    <input 
                      className="w-full p-3 rounded-xl border border-pine-100 mt-1 outline-none focus:ring-2 focus:ring-pine-600/20"
                      value={selectedLead.email}
                      onChange={(e) => setSelectedLead({...selectedLead, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase">Teléfono</label>
                    <input 
                      className="w-full p-3 rounded-xl border border-pine-100 mt-1 outline-none focus:ring-2 focus:ring-pine-600/20"
                      value={selectedLead.phone}
                      onChange={(e) => setSelectedLead({...selectedLead, phone: e.target.value})}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-8">
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p><p className="font-bold text-slate-700">{selectedLead.email}</p></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono</p><p className="font-bold text-slate-700">{selectedLead.phone}</p></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {notification.show && (
        <AppNotification 
          title={notification.title} message={notification.message} type={notification.type} 
          onClose={() => setNotification({ ...notification, show: false })} 
        />
      )}
    </div>
  );
}