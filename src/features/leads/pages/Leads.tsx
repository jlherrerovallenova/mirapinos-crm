// src/pages/Leads.tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Mail,
  Phone,
  ChevronRight,
  UserPlus,
  Loader2,
  MessageCircle,
  Filter,
  ChevronLeft,
  FilterX,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Globe,
  Smartphone,
  Users
} from 'lucide-react';
import CreateLeadModal from '../components/CreateLeadModal';
import LeadDetailModal from '../components/LeadDetailModal';
import EmailComposerModal from '../components/EmailComposerModal';
import { AppNotification } from '../../../components/ui/AppNotification';
import { useDocuments } from '../../../hooks/useDocuments';
import { useLeads } from '../hooks/useLeads';
import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../types/supabase';

type Lead = Database['public']['Tables']['leads']['Row'];

const ITEMS_PER_PAGE = 10;

const STATUS_LABELS: Record<string, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  qualified: 'Cualificado',
  visiting: 'Visitando',
  proposal: 'Propuesta',
  negotiation: 'Negociación',
  closed: 'Venta realizada',
  lost: 'Perdido',
};

const STATUS_CONFIG: Record<string, { dot: string; pill: string }> = {
  new:         { dot: 'bg-blue-500',    pill: 'bg-blue-50 text-blue-700 border border-blue-100' },
  contacted:   { dot: 'bg-slate-400',   pill: 'bg-slate-50 text-slate-600 border border-slate-200' },
  qualified:   { dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
  visiting:    { dot: 'bg-cyan-500',    pill: 'bg-cyan-50 text-cyan-700 border border-cyan-100' },
  proposal:    { dot: 'bg-amber-500',   pill: 'bg-amber-50 text-amber-700 border border-amber-100' },
  negotiation: { dot: 'bg-orange-500',  pill: 'bg-orange-50 text-orange-700 border border-orange-100' },
  closed:      { dot: 'bg-indigo-500',  pill: 'bg-indigo-50 text-indigo-700 border border-indigo-100' },
  lost:        { dot: 'bg-red-500',     pill: 'bg-red-50 text-red-700 border border-red-100' },
};

const getAvatarStyle = (name: string) => {
  const firstChar = name.trim().charAt(0).toUpperCase();
  if ('AEIOU'.includes(firstChar)) return 'bg-indigo-50 text-indigo-700 border-indigo-100';
  if ('BCDFG'.includes(firstChar)) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if ('HJKLMN'.includes(firstChar)) return 'bg-purple-50 text-purple-700 border-purple-100';
  if ('PQRSTW'.includes(firstChar)) return 'bg-amber-50 text-amber-700 border-amber-100';
  return 'bg-slate-50 text-slate-700 border-slate-200';
};

const getStatusBadge = (status: Lead['status']) => {
  const cfg = STATUS_CONFIG[status || 'new'] || STATUS_CONFIG['new'];
  const label = STATUS_LABELS[status || 'new'] || 'Nuevo';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cfg.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {label}
    </span>
  );
};

export default function Leads() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: rawDocs = [] } = useDocuments();
  const availableDocs = rawDocs
    .filter(doc => doc.url)
    .map(doc => ({ name: doc.name, url: doc.url!, category: doc.category }));

  // Estados de Búsqueda y Filtros sincronizados con la URL
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '');
  const [sourceFilter, setSourceFilter] = useState<string>(searchParams.get('source') || '');

  // Estados de Paginación
  const [page, setPage] = useState(1);

  // Estados de Ordenación
  const [sortField, setSortField] = useState<'name' | 'created_at'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [emailLead, setEmailLead] = useState<Lead | null>(null);
  const [initialMethod, setInitialMethod] = useState<'email' | 'whatsapp'>('email');

  const [notification, setNotification] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, title: '', message: '', type: 'success' });

  // React Query para la gestión de leads
  const { 
    data, 
    isLoading: loading 
  } = useLeads({
    page,
    pageSize: ITEMS_PER_PAGE,
    searchTerm,
    statusFilter,
    sourceFilter,
    sortField,
    sortDirection
  });

  const leads = data?.leads || [];
  const totalLeads = data?.totalCount || 0;

  // Sincronizar el estado interno si la URL cambia
  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
    setStatusFilter(searchParams.get('status') || '');
    setSourceFilter(searchParams.get('source') || '');
    
    // Check for "create=true" to open the New Client modal
    if (searchParams.get('create') === 'true') {
      setIsCreateModalOpen(true);
      // Clean up the URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('create');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Auto-abrir ficha del cliente si se especifica el parámetro 'open'
  useEffect(() => {
    const openId = searchParams.get('open');
    if (openId) {
      const fetchLeadAndOpen = async () => {
        try {
          const { data: leadData } = await supabase
            .from('leads')
            .select('*')
            .eq('id', openId)
            .maybeSingle();

          if (leadData) {
            setSelectedLead(leadData);
          }
        } catch (error) {
          console.error("Error fetching lead to open:", error);
        } finally {
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('open');
          setSearchParams(newParams, { replace: true });
        }
      };
      fetchLeadAndOpen();
    }
  }, [searchParams, setSearchParams]);

  const handleSort = (field: 'name' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(1);
  };

  const showMsg = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setNotification({ show: true, type, title, message });
  };

  const openComposer = (lead: Lead, method: 'email' | 'whatsapp') => {
    setInitialMethod(method);
    setEmailLead(lead);
  };

  const updateURLParams = (key: string, value: string) => {
    if (value) {
      searchParams.set(key, value);
    } else {
      searchParams.delete(key);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setPage(1);
    updateURLParams('search', value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setStatusFilter(value);
    setPage(1);
    updateURLParams('status', value);
  };

  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSourceFilter(value);
    setPage(1);
    updateURLParams('source', value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setSourceFilter('');
    setPage(1);
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters = searchTerm !== '' || statusFilter !== '' || sourceFilter !== '';
  const totalPages = Math.ceil(totalLeads / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* CABECERA DE LA PÁGINA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Mis Clientes</h2>
          <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
            <span className="inline-block w-2.5 h-2.5 bg-[#006c4a] rounded-full shrink-0"></span>
            {totalLeads} prospectos activos en cartera
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[#006c4a] hover:bg-[#005137] text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 shrink-0 flex-1 md:flex-none justify-center"
        >
          <UserPlus size={18} />
          Nuevo Cliente
        </button>
      </div>

      {/* SECCIÓN DE FILTROS */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/60 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[280px] group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#006c4a] transition-colors" size={16} />
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#006c4a]/10 focus:border-[#006c4a] focus:bg-white transition-all shadow-sm"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="pl-9 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors shadow-sm cursor-pointer outline-none appearance-none w-full sm:w-auto"
            >
              <option value="">Todos los Estados</option>
              <option value="new">Nuevos</option>
              <option value="contacted">Contactados</option>
              <option value="qualified">Cualificados</option>
              <option value="visiting">Visitando</option>
              <option value="proposal">Propuesta</option>
              <option value="negotiation">Negociación</option>
              <option value="closed">Venta realizada</option>
              <option value="lost">Perdidos</option>
            </select>
          </div>

          <div className="relative flex-1 sm:flex-none">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            <select
              value={sourceFilter}
              onChange={handleSourceChange}
              className="pl-9 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors shadow-sm cursor-pointer outline-none appearance-none w-full sm:w-auto"
            >
              <option value="">Cualquier Origen</option>
              <option value="Idealista">Idealista</option>
              <option value="Web">Web</option>
              <option value="Google">Google</option>
              <option value="Redes Sociales">Redes Sociales</option>
              <option value="Referido">Referido</option>
              <option value="Llamada">Llamada</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors shadow-sm flex items-center justify-center shrink-0 border border-red-100"
              title="Limpiar filtros"
            >
              <FilterX size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden min-h-[500px] flex flex-col relative z-10">
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
            <p className="text-slate-500 font-medium text-center px-4">
              {hasActiveFilters
                ? "No hay clientes que coincidan con los filtros actuales."
                : "No hay clientes registrados en la base de datos."}
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-emerald-600 font-bold text-sm mt-4 hover:underline px-4 py-2 bg-emerald-50 rounded-lg">
                Limpiar todos los filtros
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200/50 hidden md:grid">
              <div
                className={`col-span-3 flex items-center gap-1 cursor-pointer select-none transition-colors ${sortField === 'name' ? 'text-slate-700' : 'hover:text-slate-600'}`}
                onClick={() => handleSort('name')}
              >
                Cliente
                {sortField === 'name' ? (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} className="opacity-30" />}
              </div>
              <div className="col-span-3">Contacto</div>
              <div className="col-span-2 text-center">Estado</div>
              <div className="col-span-1 text-center">Origen</div>
              <div
                className={`col-span-2 flex items-center justify-center gap-1 cursor-pointer select-none transition-colors ${sortField === 'created_at' ? 'text-slate-700' : 'hover:text-slate-600'}`}
                onClick={() => handleSort('created_at')}
              >
                Alta
                {sortField === 'created_at' ? (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} className="opacity-30" />}
              </div>
              <div className="col-span-1 text-left pl-2">Acciones</div>
            </div>

            {leads.map((lead) => {
              return (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center cursor-pointer group border-b border-slate-100 hover:bg-slate-50/80 hover:translate-x-1 transition-all duration-200"
                >
                  <div className="md:col-span-3 flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center shrink-0 border ${getAvatarStyle(lead.name || '')}`}>
                      {lead.name?.substring(0, 2).toUpperCase() || 'CL'}
                    </div>
                    <div className="min-w-0 flex items-center">
                      <h3 className="font-bold text-slate-900 text-sm truncate group-hover:text-emerald-700 transition-colors leading-tight">{lead.name}</h3>
                    </div>
                  </div>

                  <div className="md:col-span-3 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
                      <div className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                        <Mail size={11} className="text-blue-400" />
                      </div>
                      <span className="truncate">{lead.email || <span className="text-slate-300 italic">Sin email</span>}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
                      <div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center shrink-0">
                        <Phone size={11} className="text-emerald-400" />
                      </div>
                      <span className="truncate">{lead.phone || <span className="text-slate-300 italic">Sin teléfono</span>}</span>
                    </div>
                  </div>

                  <div className="md:col-span-2 flex justify-center">
                    {getStatusBadge(lead.status)}
                  </div>

                  <div className="md:col-span-1 flex justify-center">
                    {(() => {
                      const src = (lead.source || 'Directo').toLowerCase();
                      if (src.includes('idealista')) return (
                        <div className="flex items-center gap-1 bg-[#85f8c4]/35 text-[#005137] border border-[#85f8c4] px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm" title="Idealista">
                          id
                        </div>
                      );
                      if (src.includes('web') || src.includes('google')) return <div title={lead.source || 'Web'} className="p-1.5 bg-blue-50 rounded-lg text-blue-600"><Globe size={14} /></div>;
                      if (src.includes('insta') || src.includes('facebook') || src.includes('redes')) return <div title={lead.source || 'Social'} className="p-1.5 bg-purple-50 rounded-lg text-purple-600"><Smartphone size={14} /></div>;
                      if (src.includes('referido') || src.includes('amigo')) return <div title={lead.source || 'Referido'} className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600"><Users size={14} /></div>;
                      if (src.includes('llamada')) return <div title="Llamada" className="p-1.5 bg-amber-50 rounded-lg text-amber-600"><Phone size={14} /></div>;
                      return (
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-full px-2.5 py-1 truncate block text-center min-w-[70px]">
                          {lead.source || 'Directo'}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="md:col-span-2 flex justify-center items-center">
                    <p className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="hidden md:flex md:col-span-1 items-center justify-start gap-1 pl-2">
                    <button onClick={(e) => { e.stopPropagation(); openComposer(lead, 'whatsapp'); }} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center shrink-0" title="WhatsApp"><MessageCircle size={15} /></button>
                    <button onClick={(e) => { e.stopPropagation(); openComposer(lead, 'email'); }} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center shrink-0" title="Email"><Mail size={15} /></button>
                    <ChevronRight size={15} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalLeads > 0 && (
          <div className="p-4 border-t border-slate-200/60 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium text-center md:text-left">
              Mostrando {leads.length} de {totalLeads} prospectos
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Renderizar números de páginas */}
              {(() => {
                const pages = [];
                const maxVisible = 3;
                let start = Math.max(1, page - 1);
                let end = Math.min(totalPages, start + maxVisible - 1);

                if (end - start < maxVisible - 1) {
                  start = Math.max(1, end - maxVisible + 1);
                }

                for (let i = start; i <= end; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                        page === i
                          ? 'bg-[#006c4a] text-white shadow-sm shadow-[#006c4a]/10'
                          : 'hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      {i}
                    </button>
                  );
                }

                return (
                  <>
                    {start > 1 && (
                      <>
                        <button
                          onClick={() => setPage(1)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                            page === 1 ? 'bg-[#006c4a] text-white' : 'hover:bg-slate-100 text-slate-600'
                          }`}
                        >
                          1
                        </button>
                        {start > 2 && <span className="px-1 text-slate-400 text-xs">...</span>}
                      </>
                    )}
                    {pages}
                    {end < totalPages && (
                      <>
                        {end < totalPages - 1 && <span className="px-1 text-slate-400 text-xs">...</span>}
                        <button
                          onClick={() => setPage(totalPages)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                            page === totalPages ? 'bg-[#006c4a] text-white' : 'hover:bg-slate-100 text-slate-600'
                          }`}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </>
                );
              })()}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => { showMsg('success', '¡Completado!', 'El nuevo cliente ha sido creado con éxito.'); }}
      />

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={(deleted?: boolean) => {
            if (deleted) showMsg('success', 'Cliente eliminado', 'Cliente borrado.');
            else showMsg('info', 'Cliente actualizado', 'Cambios guardados.');
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
          onSentSuccess={() => { showMsg('success', 'Mensaje enviado', 'Registrado correctamente.'); }}
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