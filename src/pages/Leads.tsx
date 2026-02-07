import React, { useState, useEffect } from 'react';
import { StageBadge, AppNotification } from '../components/Shared';
import { supabase } from '../lib/supabase';
import { 
  Search, Plus, X, Loader2, Globe, Edit2, Trash2, 
  Mail, Phone, Eye, Save, FileText, History, Send, Clock
} from 'lucide-react';

export default function Leads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  
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
          <p className="text-pine-600 font-bold uppercase tracking-[0.3em] text-[10px] mb-2">CRM Gestión</p>
          <h1 className="text-4xl font-poppins font-bold text-slate-900 tracking-tight">Clientes</h1>
        </div>
        <button className="px-8 py-4 bg-pine-900 text-white font-bold rounded-2xl flex items-center gap-2 hover:bg-pine-800 transition-all shadow-lg shadow-pine-900/10">
          <Plus size={20} /> NUEVO PROSPECTO
        </button>
      </header>

      {/* Buscador */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-pine-100 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-pine-600/10" 
            placeholder="Buscar por nombre o correo..." 
          />
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="bg-white rounded-4xl shadow-sm border border-pine-100 overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-pine-600" size={40}/></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-pine-50/50">
                <th className="px-8 py-5 text-left text-[10px] font-black text-pine-900/40 uppercase tracking-widest">Cliente</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-pine-900/40 uppercase tracking-widest">Estado</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-pine-900/40 uppercase tracking-widest">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pine-50">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} onClick={() => { setSelectedLead(lead); setIsEditing(false); }} className="hover:bg-pine-50/30 transition-colors cursor-pointer group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-pine-100 rounded-xl flex items-center justify-center text-pine-600 font-bold uppercase">{lead.firstName?.[0]}{lead.lastName?.[0]}</div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{lead.firstName} {lead.lastName}</p>
                        <p className="text-xs text-slate-400">{lead.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6"><StageBadge stage={lead.stage} /></td>
                  <td className="px-8 py-6 text-right"><Eye size={20} className="text-slate-300 ml-auto group-hover:text-pine-600 transition-colors" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL MAESTRO DE CLIENTE */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-pine-900/60 backdrop-blur-sm" onClick={() => setSelectedLead(null)}></div>
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-y-auto animate-in zoom-in-95 duration-300">
            
            {/* Cabecera Premium */}
            <div className="bg-pine-900 p-10 text-white flex justify-between items-start sticky top-0 z-10">
              <div className="flex-1">
                {isEditing ? (
                  <div className="flex gap-4">
                    <input className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-2xl font-bold outline-none" value={selectedLead.firstName} onChange={(e) => setSelectedLead({...selectedLead, firstName: e.target.value})} />
                    <input className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-2xl font-bold outline-none" value={selectedLead.lastName} onChange={(e) => setSelectedLead({...selectedLead, lastName: e.target.value})} />
                  </div>
                ) : (
                  <>
                    <h2 className="text-4xl font-poppins font-bold tracking-tighter">{selectedLead.firstName} {selectedLead.lastName}</h2>
                    <div className="mt-4"><StageBadge stage={selectedLead.stage} /></div>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                {isEditing ? (
                  <button onClick={handleSaveEdit} className="p-4 bg-emerald-500 hover:bg-emerald-600 rounded-2xl text-white transition-all shadow-lg"><Save size={20} /></button>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 text-white transition-all"><Edit2 size={20} /></button>
                )}
                <button onClick={(e) => handleDelete(e, selectedLead.id, selectedLead.firstName)} className="p-4 bg-rose-500/20 hover:bg-rose-500 text-white rounded-2xl border border-rose-500/20 transition-all"><Trash2 size={20} /></button>
                <button onClick={() => setSelectedLead(null)} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><X size={20} /></button>
              </div>
            </div>

            <div className="p-10 space-y-12">
              {/* Sección: Información y Contacto */}
              <section className="grid grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-pine-900/30 uppercase tracking-[0.2em] flex items-center gap-2">
                    <User size={14} /> Datos de Contacto
                  </h3>
                  <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Email Corporativo</p>
                      {isEditing ? (
                        <input className="w-full mt-1 p-2 bg-white rounded-lg border border-pine-100" value={selectedLead.email} onChange={(e) => setSelectedLead({...selectedLead, email: e.target.value})} />
                      ) : (
                        <p className="font-bold text-slate-700">{selectedLead.email}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Teléfono Móvil</p>
                      {isEditing ? (
                        <input className="w-full mt-1 p-2 bg-white rounded-lg border border-pine-100" value={selectedLead.phone} onChange={(e) => setSelectedLead({...selectedLead, phone: e.target.value})} />
                      ) : (
                        <p className="font-bold text-slate-700">{selectedLead.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* NUEVA Sección: Enviar Documentación */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-pine-900/30 uppercase tracking-[0.2em] flex items-center gap-2">
                    <FileText size={14} /> Documentación
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    <button className="flex items-center justify-between p-4 bg-white border border-pine-100 rounded-2xl hover:bg-pine-50 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-pine-50 rounded-lg text-pine-600"><FileText size={18}/></div>
                        <span className="text-sm font-bold text-slate-700">Dossier Informativo</span>
                      </div>
                      <Send size={16} className="text-slate-300 group-hover:text-pine-600" />
                    </button>
                    <button className="flex items-center justify-between p-4 bg-white border border-pine-100 rounded-2xl hover:bg-pine-50 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-pine-50 rounded-lg text-pine-600"><FileText size={18}/></div>
                        <span className="text-sm font-bold text-slate-700">Contrato de Reserva</span>
                      </div>
                      <Send size={16} className="text-slate-300 group-hover:text-pine-600" />
                    </button>
                  </div>
                </div>
              </section>

              {/* NUEVA Sección: Historial de Acciones */}
              <section className="space-y-6">
                <h3 className="text-xs font-black text-pine-900/30 uppercase tracking-[0.2em] flex items-center gap-2">
                  <History size={14} /> Historial de Actividad
                </h3>
                <div className="space-y-4">
                  {[
                    { date: 'Hoy, 10:30', text: 'Documento "Dossier Informativo" enviado vía email.', icon: <Send size={12}/> },
                    { date: 'Ayer, 16:45', text: 'Cambio de estado: de Prospecto a Interés.', icon: <Clock size={12}/> },
                    { date: '12 Feb, 09:15', text: 'Llamada de seguimiento realizada por Agente.', icon: <Phone size={12}/> }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 relative">
                      {i !== 2 && <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-slate-100"></div>}
                      <div className="w-6 h-6 rounded-full bg-pine-50 flex items-center justify-center text-pine-600 z-10">
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">{item.date}</p>
                        <p className="text-sm text-slate-700 font-medium">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            
            <div className="p-10 bg-slate-50 border-t border-pine-50">
              <button className="w-full bg-white text-pine-900 border border-pine-100 py-4 rounded-2xl font-bold text-sm hover:bg-pine-900 hover:text-white transition-all shadow-sm">
                Cerrar Expediente
              </button>
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