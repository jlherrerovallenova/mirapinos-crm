// src/pages/Leads.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Search, 
  Mail, 
  Phone, 
  ChevronRight,
  UserPlus,
  Loader2,
  MessageCircle,
  Calendar,
  Filter,
  Building2,
  Download,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import CreateLeadModal from '../components/leads/CreateLeadModal';
import LeadDetailModal from '../components/leads/LeadDetailModal';
import EmailComposerModal from '../components/leads/EmailComposerModal';
import ExportLeadsModal from '../components/leads/ExportLeadsModal';
import { AppNotification } from '../components/AppNotification';
import type { Database } from '../types/supabase';

type Lead = Database['public']['Tables']['leads']['Row'];

const ITEMS_PER_PAGE = 10; // Cantidad de leads por página

const getStatusBadge = (status: Lead['status']) => {
  const styles = {
    new: 'bg-blue-100 text-blue-700 ring-blue-600/20',
    contacted: 'bg-purple-100 text-purple-700 ring-purple-600/20',
    qualified: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
    proposal: 'bg-amber-100 text-amber-700 ring-amber-600/20',
    negotiation: 'bg-orange-100 text-orange-700 ring-orange-600/20',
    closed: 'bg-slate-900 text-slate-100 ring-slate-600/20',
    lost: 'bg-red-100 text-red-700 ring-red-600/20',
  };
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'New';
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[status || 'new']}`}>
      {label}
    </span>
  );
};

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [availableDocs, setAvailableDocs] = useState<{name: string, url: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados de Paginación
  const [page, setPage] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [emailLead, setEmailLead] = useState<Lead | null>(null);
  const [initialMethod, setInitialMethod] = useState<'email' | 'whatsapp'>('email');
  
  const [notification, setNotification] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, title: '', message: '', type: 'success' });

  // Recargar datos cuando cambia la página o el término de búsqueda
  useEffect(() => {
    fetchLeads();
  }, [page, searchTerm]); 

  // Cargar documentos solo una vez al inicio
  useEffect(() => {
    fetchDocuments();
  }, []);

  const showMsg = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setNotification({ show: true, type, title, message });
  };

  async function fetchLeads() {
    try {
      setLoading(true);
      
      // Calcular rango para paginación (0-9, 10-19, etc.)
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('leads')
        .select('*', { count: 'exact' }) // Solicitamos el conteo total exacto
        .order('created_at', { ascending: false });

      // Si hay búsqueda, filtramos (Nota: la búsqueda en Supabase con 'or' y paginación puede ser compleja,
      // para una app real grande se recomienda usar Full Text Search, aquí usamos ilike básico)
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      // Aplicamos paginación
      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      
      if (data) setLeads(data);
      if (count !== null) setTotalLeads(count);

    } catch (error) {
      console.error('Error fetching leads:', error);
      showMsg('error', 'Error de conexión', 'No se pudieron cargar los prospectos.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchDocuments() {
    try {
      const { data, error } = await supabase.from('documents').select('name, url');
      if (data) setAvailableDocs(data.map(doc => ({ name: doc.name, url: doc.url })));
    } catch (error) {
      console.error('Error fetching docs:', error);
    }
  }

  const openComposer = (lead: Lead, method: 'email' | 'whatsapp') => {
    setInitialMethod(method);
    setEmailLead(lead);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Resetear a página 1 al buscar
  };

  const totalPages = Math.ceil(totalLeads / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      
      {/* HEADER SUPERIOR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Mis Leads</h1>
          <p className="text-slate-500 text-xs font-medium">
            {totalLeads} prospectos totales {searchTerm && `(filtrado)`}
          </p>
        </div>

        <div className="flex flex-1 max-w-2xl items-center gap-3">
            <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                <input 
                    type="text"
                    placeholder="Buscar por nombre, email o teléfono..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                    value={searchTerm}
                    onChange={handleSearch}
                />
            </div>
            
            <button 
                onClick={() => setIsExportModalOpen(true)}
                className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-emerald-600 transition-colors shadow-sm hidden sm:flex items-center gap-2"
                title="Exportar Listado"
            >
                <Download size={18} />
                <span className="hidden lg:inline text-xs font-bold">Exportar</span>
            </button>

            <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-3 bg-slate-900 text-white font-bold text-sm rounded-xl shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95 shrink-0"
            >
                <UserPlus size={18} /> <span className="hidden sm:inline">Nuevo Lead</span>
            </button>
        </div>
      </div>

      {/* LISTA PRINCIPAL */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
            <Loader2 className="animate-spin" size={40} />
            <p className="font-medium animate-pulse">Cargando base de datos...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                <Search size={24} />
            </div>
            <p className="text-slate-500 font-medium">No se encontraron leads.</p>
            {searchTerm && (
                <button onClick={() => { setSearchTerm(''); setPage(1); }} className="text-emerald-600 font-bold text-sm mt-2 hover:underline">
                    Limpiar búsqueda
                </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 flex-1">
            {/* Cabecera de tabla */}
            <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50/50 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 hidden md:grid">
                <div className="col-span-4 pl-2">Prospecto</div>
                <div className="col-span-2">Estado</div>
                <div className="col-span-3">Contacto</div>
                <div className="col-span-2">Origen / Fecha</div>
                <div className="col-span-1 text-right pr-4">Acciones</div>
            </div>

            {/* Filas */}
            {leads.map((lead) => (
              <div 
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className="md:col-span-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0 shadow-sm">
                        {lead.name?.substring(0, 2).toUpperCase() || "L"}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm truncate group-hover:text-emerald-700 transition-colors">{lead.name}</h3>
                        {lead.company && (
                            <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                                <Building2 size={10} /> {lead.company}
                            </p>
                        )}
                    </div>
                </div>

                <div className="md:col-span-2">
                    {getStatusBadge(lead.status)}
                </div>

                <div className="md:col-span-3 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs text-slate-600 truncate">
                        <Mail size={12} className="text-slate-400" />
                        {lead.email || <span className="text-slate-300 italic">Sin email</span>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 truncate">
                        <Phone size={12} className="text-slate-400" />
                        {lead.phone || <span className="text-slate-300 italic">Sin teléfono</span>}
                    </div>
                </div>

                <div className="md:col-span-2">
                    <p className="text-xs font-medium text-slate-700">{lead.source || 'Directo'}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar size={10} /> {new Date(lead.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </p>
                </div>

                <div className="md:col-span-1 flex items-center justify-end gap-2">
                    <button 
                        onClick={(e) => { e.stopPropagation(); openComposer(lead, 'whatsapp'); }}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="WhatsApp"
                    >
                        <MessageCircle size={16} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); openComposer(lead, 'email'); }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Email"
                    >
                        <Mail size={16} />
                    </button>
                    <button className="p-2 text-slate-300 group-hover:text-emerald-600 transition-colors">
                        <ChevronRight size={16} />
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- BARRA DE PAGINACIÓN --- */}
        {totalLeads > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Mostrando {leads.length} de {totalLeads} leads
            </span>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(1)} 
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Primera página"
              >
                <ChevronsLeft size={16} />
              </button>
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Anterior"
              >
                <ChevronLeft size={16} />
              </button>
              
              <span className="text-xs font-bold text-slate-700 px-2">
                Página {page} de {totalPages || 1}
              </span>

              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Siguiente"
              >
                <ChevronRight size={16} />
              </button>
              <button 
                onClick={() => setPage(totalPages)} 
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Última página"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- MODALES --- */}
      <ExportLeadsModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
      
      <CreateLeadModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={() => { fetchLeads(); showMsg('success', '¡Completado!', 'El nuevo lead ha sido creado con éxito.'); }} 
      />
      
      {selectedLead && (
        <LeadDetailModal 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)} 
          onUpdate={(deleted?: boolean) => {
            fetchLeads();
            if (deleted) showMsg('success', 'Lead eliminado', 'Cliente borrado.');
            else showMsg('info', 'Lead actualizado', 'Cambios guardados.');
          }} 
        />
      )}
      
      {emailLead && (
        <EmailComposerModal
          isOpen={!!emailLead}
          onClose={() => setEmailLead(null)}
          leadId={emailLead.id}
          leadName={emailLead.name}
          leadEmail={emailLead.email}
          leadPhone={emailLead.phone}
          availableDocs={availableDocs}
          onSentSuccess={() => { fetchLeads(); showMsg('success', 'Mensaje enviado', 'Registrado correctamente.'); }}
          initialMethod={initialMethod}
        />
      )}
      
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