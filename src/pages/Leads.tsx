// src/pages/Leads.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { StageBadge, AppNotification } from '../components/Shared';
import CreateLeadModal from '../components/leads/CreateLeadModal';
import LeadDetailModal from '../components/leads/LeadDetailModal';
import EmailComposerModal from '../components/leads/EmailComposerModal';
import { 
  Search, Plus, Eye, Globe, Loader2 
} from 'lucide-react';

export default function Leads() {
  // --- 1. ESTADOS ---
  const [leads, setLeads] = useState<any[]>([]);
  const [availableDocs, setAvailableDocs] = useState<any[]>([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Estado para el Modal de Creación
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Estado para el Lead Seleccionado (Abre el Modal de Detalle)
  const [selectedLead, setSelectedLead] = useState<any>(null);
  
  // Estado para el Modal de Email (Se abre desde el Detalle)
  const [emailComposerState, setEmailComposerState] = useState<{
    isOpen: boolean;
    lead: any;
    docs: string[];
  }>({
    isOpen: false, 
    lead: null, 
    docs: []
  });

  // Estado de Notificaciones
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

  // --- 2. CARGA DE DATOS ---
  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);
    try {
      const [leadsRes, docsRes] = await Promise.all([
        supabase.from('leads').select('*').order('createdAt', { ascending: false }),
        supabase.from('documents').select('*').order('name', { ascending: true })
      ]);

      if (leadsRes.error) throw leadsRes.error;
      if (docsRes.error) throw docsRes.error;

      if (leadsRes.data) setLeads(leadsRes.data);
      if (docsRes.data) setAvailableDocs(docsRes.data);
    } catch (error: any) {
      console.error("Error cargando datos:", error);
      showNotif("ERROR", "Error de conexión al cargar datos.", 'error');
    } finally {
      setLoading(false);
    }
  }

  // --- 3. HELPER PARA NOTIFICACIONES ---
  const showNotif = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ show: true, title, message, type });
  };

  // --- 4. ACCIONES GLOBALES (Borrar) ---
  const handleDeleteLead = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este cliente definitivamente?")) return;
    
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
      
      setSelectedLead(null); // Cerrar modal si estaba abierto
      fetchInitialData(); // Recargar lista
      showNotif("ELIMINADO", "Cliente eliminado correctamente.", 'error');
    } catch (error: any) {
      showNotif("ERROR", error.message || "No se pudo eliminar.", 'error');
    }
  };

  // --- 5. FILTRADO ---
  const filteredLeads = leads.filter(lead => 
    `${lead.firstName || ''} ${lead.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-pine-600 font-bold uppercase tracking-[0.3em] text-[10px] mb-2">CRM Comercial</p>
          <h1 className="text-4xl font-poppins font-bold text-slate-900 tracking-tight">Cartera de Clientes</h1>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)} 
          className="px-8 py-4 bg-pine-900 text-white font-bold rounded-2xl shadow-xl hover:bg-pine-800 transition-all flex items-center gap-3 active:scale-95"
        >
          <Plus size={20} /> NUEVO PROSPECTO
        </button>
      </header>

      {/* BUSCADOR */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-pine-100 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-pine-600/10 transition-all" 
            placeholder="Buscar por nombre, email o teléfono..." 
          />
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-white rounded-4xl shadow-sm border border-pine-100 overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center">
            <Loader2 className="animate-spin text-pine-600" size={40}/>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-pine-50/50 border-b border-pine-50">
                <th className="px-8 py-5 text-left text-[10px] font-black text-pine-900/40 uppercase tracking-widest">Cliente</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-pine-900/40 uppercase tracking-widest">Estado</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-pine-900/40 uppercase tracking-widest hidden md:table-cell">Origen</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-pine-900/40 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pine-50">
              {filteredLeads.map((lead) => (
                <tr 
                  key={lead.id} 
                  onClick={() => setSelectedLead(lead)} 
                  className="hover:bg-pine-50/30 transition-colors cursor-pointer group"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white shadow-sm border border-pine-100 rounded-2xl flex items-center justify-center text-pine-600 font-bold uppercase text-lg">
                        {lead.firstName?.[0]}{lead.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{lead.firstName} {lead.lastName}</p>
                        <p className="text-xs text-slate-400 font-medium">{lead.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6"><StageBadge stage={lead.stage} /></td>
                  <td className="px-8 py-6 hidden md:table-cell">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full w-fit">
                      <Globe size={12} className="text-pine-600" /> {lead.source || 'Web'}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Eye size={20} className="text-slate-300 ml-auto group-hover:text-pine-600 transition-colors" />
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-slate-400 italic text-sm">
                    No se encontraron clientes con ese criterio.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* --- INTEGRACIÓN DE MODALES --- */}
      
      {/* 1. Modal Nuevo Cliente */}
      <CreateLeadModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={() => { 
          fetchInitialData(); 
          showNotif("CREADO", "Cliente añadido correctamente."); 
        }} 
        onError={(msg) => showNotif("ERROR", msg, 'error')} 
      />

      {/* 2. Modal Detalle / Edición / Docs */}
      {selectedLead && (
        <LeadDetailModal 
          lead={selectedLead}
          availableDocs={availableDocs}
          onClose={() => setSelectedLead(null)}
          onUpdate={() => { 
            fetchInitialData(); 
            showNotif("ACTUALIZADO", "Datos guardados correctamente."); 
          }}
          onDelete={() => handleDeleteLead(selectedLead.id)}
          onOpenEmail={(docs) => setEmailComposerState({ isOpen: true, lead: selectedLead, docs })}
        />
      )}

      {/* 3. Modal Envío de Email */}
      <EmailComposerModal 
        isOpen={emailComposerState.isOpen}
        onClose={() => setEmailComposerState(prev => ({ ...prev, isOpen: false }))}
        lead={emailComposerState.lead}
        selectedDocIds={emailComposerState.docs}
        allDocs={availableDocs}
        onSuccess={() => showNotif("ENVIADO", "Correo enviado con éxito.")}
      />

      {/* Notificaciones Toast */}
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