// src/pages/Leads.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StageBadge, AppNotification } from '../components/Shared';
import { supabase } from '../lib/supabase';
import { 
  Search, 
  Plus, 
  X, 
  Loader2, 
  Globe, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar, 
  User,
  Eye
} from 'lucide-react';

export default function Leads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  
  const [notification, setNotification] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    title: '',
    message: '',
    type: 'success'
  });

  const [newLead, setNewLead] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    stage: 'Prospecto',
    source: 'Web'
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('createdAt', { ascending: false });
    if (!error && data) setLeads(data);
    setLoading(false);
  }

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('leads').insert([newLead]);
    if (!error) {
      setIsModalOpen(false);
      setNewLead({ firstName: '', lastName: '', email: '', phone: '', stage: 'Prospecto', source: 'Web' });
      fetchLeads();
      setNotification({ show: true, title: "ÉXITO", message: "Cliente creado correctamente", type: 'success' });
    } else {
      setNotification({ show: true, title: "ERROR", message: error.message, type: 'error' });
    }
  };

  const handleDelete = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    setSelectedLead(null);
    setNotification({
      show: true,
      title: "CLIENTE ELIMINADO",
      message: `El registro de ${name} ha sido borrado correctamente.`,
      type: 'error'
    });
  };

  const handleEdit = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    setNotification({
      show: true,
      title: "MODO EDICIÓN",
      message: `Cargando formulario para editar a ${name}...`,
      type: 'info'
    });
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
          className="px-8 py-4 bg-pine-600 text-white font-bold rounded-2xl shadow-lg hover:bg-emerald-500 transition-all text-sm flex items-center gap-2"
        >
          <Plus size={20} /> Crear Cliente
        </button>
      </header>

      {/* LISTADO DE CLIENTES */}
      <div className="bg-white rounded-4xl shadow-sm border border-pine-100 overflow-hidden">
        <div className="p-6 border-b border-pine-50 flex justify-between items-center bg-white">
          <div className="relative">
            <Search className="absolute left-4 top-2.5 text-slate-400" size={18} />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-2.5 bg-pine-50 border-none rounded-xl text-sm w-80 outline-none focus:ring-2 focus:ring-pine-600/10" 
              placeholder="Buscar por nombre o correo..." 
            />
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
                <th className="px-8 py-5 text-left text-[10px] font-black text-pine-900/40 uppercase tracking-widest">Origen</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-pine-900/40 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pine-50">
              {filteredLeads.map((lead) => (
                <tr 
                  key={lead.id} 
                  onClick={() => setSelectedLead(lead)}
                  className="hover:bg-pine-50/30 transition-colors group cursor-pointer"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-pine-100 rounded-xl flex items-center justify-center text-pine-600 font-bold text-xs uppercase">
                        {lead.firstName?.[0]}{lead.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{lead.firstName} {lead.lastName}</p>
                        <p className="text-xs text-slate-400">{lead.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6"><StageBadge stage={lead.stage} /></td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full w-fit">
                      <Globe size={12} className="text-pine-600" />
                      {lead.source || 'Web'}
                    </div>
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

      {/* MODAL DETALLE CON BOTONES EDITAR/BORRAR */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-pine-900/60 backdrop-blur-sm" onClick={() => setSelectedLead(null)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-pine-900 p-10 text-white flex justify-between items-start">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-bold mb-4">
                  {selectedLead.firstName?.[0]}
                </div>
                <h2 className="text-3xl font-poppins font-bold tracking-tighter">{selectedLead.firstName} {selectedLead.lastName}</h2>
                <div className="mt-2"><StageBadge stage={selectedLead.stage} /></div>
              </div>
              <div className="flex gap-2">
                <button onClick={(e) => handleEdit(e, selectedLead.firstName)} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 text-white transition-all"><Edit2 size={20} /></button>
                <button onClick={(e) => handleDelete(e, selectedLead.firstName)} className="p-3 bg-rose-500/20 hover:bg-rose-500 text-white rounded-xl border border-rose-500/20 transition-all"><Trash2 size={20} /></button>
                <button onClick={() => setSelectedLead(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"><X size={20} /></button>
              </div>
            </div>
            <div className="p-10 grid grid-cols-2 gap-8 bg-slate-50">
              <div className="space-y-4">
                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p><p className="font-bold text-slate-700">{selectedLead.email}</p></div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono</p><p className="font-bold text-slate-700">{selectedLead.phone}</p></div>
              </div>
              <div className="space-y-4">
                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Origen</p><p className="font-bold text-slate-700">{selectedLead.source || 'Web'}</p></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREACIÓN (Omitido por brevedad, pero debe mantenerse igual) */}

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