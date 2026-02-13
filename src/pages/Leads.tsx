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

// CORRECCIÓN: Agregamos 'import type' para evitar el error "does not provide an export named 'Database'"
import type { Database } from '../types/supabase';

type Lead = Database['public']['Tables']['leads']['Row'];

export default function Leads() {
  // --- 1. ESTADOS ---
  const [leads, setLeads] = useState<Lead[]>([]);
  // Mock de documentos por ahora, ya que no tenemos tabla de documentos aún
  const [availableDocs, setAvailableDocs] = useState<any[]>([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  const [emailComposerState, setEmailComposerState] = useState<{
    isOpen: boolean;
    lead: any;
    docs: string[];
  }>({ isOpen: false, lead: null, docs: [] });

  const [notification, setNotification] = useState<{
    show: boolean; 
    title: string; 
    message: string; 
    type: 'success' | 'error' | 'info';
  }>({ show: false, title: '', message: '', type: 'success' });

  // --- 2. CARGA DE DATOS ---
  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);
    try {
      // Nota: 'created_at' es el nombre real en DB, no 'createdAt'
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setLeads(data);
      
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

  // --- 4. ACCIONES ---
  const handleDeleteLead = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este cliente definitivamente?")) return;
    
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
      
      setSelectedLead(null); 
      fetchInitialData(); 
      showNotif("ELIMINADO", "Cliente eliminado correctamente.", 'info');
    } catch (error: any) {
      showNotif("ERROR", error.message || "No se pudo eliminar.", 'error');
    }
  };

  // --- 5. FILTRADO ---
  const filteredLeads = leads.filter(lead => 
    (lead.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-emerald-600 font-bold uppercase tracking-[0.3em] text-[10px] mb-2">CRM Comercial</p>
          <h1 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Cartera de Clientes</h1>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)} 
          className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 transition-all flex items-center gap-3 active:scale-95"
        >
          <Plus size={20} /> NUEVO PROSPECTO
        </button>
      </header>

      {/* BUSCADOR */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-600/10 transition-all" 
            placeholder="Buscar por nombre, email o teléfono..." 
          />
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center">
            <Loader2 className="animate-spin text-emerald-600" size={40}/>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Origen</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLeads.map((lead) => (
                <tr 
                  key={lead.id} 
                  onClick={() => setSelectedLead(lead)} 
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      {/* Generar iniciales desde el nombre completo */}
                      <div className="w-12 h-12 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center text-emerald-600 font-bold uppercase text-lg shrink-0">
                        {lead.name.substring(0,2)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{lead.name}</p>
                        <p className="text-xs text-slate-400 font-medium">{lead.email || 'Sin email'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {/* Pasamos el estado de DB (ej: 'new') */}
                    <StageBadge stage={lead.status || 'new'} />
                  </td>
                  <td className="px-8 py-6 hidden md:table-cell">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full w-fit">
                      <Globe size={12} className="text-emerald-600" /> {lead.source || 'Web'}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Eye size={20} className="text-slate-300 ml-auto group-hover:text-emerald-600 transition-colors" />
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-slate-400 italic text-sm">
                    No se encontraron clientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* --- MODALES --- */}
      
      <CreateLeadModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={() => { 
          fetchInitialData(); 
          showNotif("CREADO", "Cliente añadido correctamente."); 
        }} 
        onError={(msg) => showNotif("ERROR", msg, 'error')} 
      />

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

      <EmailComposerModal 
        isOpen={emailComposerState.isOpen}
        onClose={() => setEmailComposerState(prev => ({ ...prev, isOpen: false }))}
        lead={emailComposerState.lead}
        selectedDocIds={emailComposerState.docs}
        allDocs={availableDocs}
        onSuccess={() => showNotif("ENVIADO", "Correo enviado con éxito.")}
      />

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