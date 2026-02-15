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
  MessageCircle
} from 'lucide-react';
import CreateLeadModal from '../components/leads/CreateLeadModal';
import LeadDetailModal from '../components/leads/LeadDetailModal';
import EmailComposerModal from '../components/leads/EmailComposerModal';
import { AppNotification } from '../components/AppNotification';
import type { Database } from '../types/supabase';

type Lead = Database['public']['Tables']['leads']['Row'];

const getStatusStyles = (status: Lead['status']) => {
  const styles = {
    new: 'bg-blue-50 text-blue-700 border-blue-100',
    contacted: 'bg-purple-50 text-purple-700 border-purple-100',
    qualified: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    proposal: 'bg-amber-50 text-amber-700 border-amber-100',
    negotiation: 'bg-orange-50 text-orange-700 border-orange-100',
    closed: 'bg-slate-900 text-white border-slate-900',
    lost: 'bg-red-50 text-red-700 border-red-100',
  };
  return styles[status || 'new'];
};

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [availableDocs, setAvailableDocs] = useState<{name: string, url: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
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

  useEffect(() => {
    fetchInitialData();
  }, []);

  const showMsg = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setNotification({ show: true, type, title, message });
  };

  async function fetchInitialData() {
    setLoading(true);
    await Promise.all([fetchLeads(), fetchDocuments()]);
    setLoading(false);
  }

  async function fetchLeads() {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setLeads(data);
    } catch (error) {
      console.error('Error fetching leads:', error);
      showMsg('error', 'Error de conexión', 'No se pudieron cargar los prospectos.');
    }
  }

  async function fetchDocuments() {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('name, url') 
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        setAvailableDocs(data.map(doc => ({
          name: doc.name,
          url: doc.url
        })));
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  }

  const openComposer = (lead: Lead, method: 'email' | 'whatsapp') => {
    setInitialMethod(method);
    setEmailLead(lead);
  };

  const filteredLeads = leads.filter(lead => {
    const search = searchTerm.toLowerCase();
    const name = lead.name?.toLowerCase() || "";
    const email = lead.email?.toLowerCase() || "";
    return name.includes(search) || email.includes(search);
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-emerald-600 font-bold uppercase tracking-[0.3em] text-[10px] mb-2">Gestión de Prospectos</p>
          <h1 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Leads</h1>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95"
        >
          <UserPlus size={20} /> NUEVO LEAD
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Buscar lead..."
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm flex justify-between">
              Total Leads <span>{leads.length}</span>
            </div>
          </div>
        </aside>

        <main className="lg:col-span-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
              <Loader2 className="animate-spin" size={40} />
              <p className="font-medium animate-pulse">Cargando base de datos...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredLeads.map((lead) => (
                <div 
                  key={lead.id}
                  className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col md:flex-row md:items-center justify-between cursor-pointer gap-4"
                  onClick={() => setSelectedLead(lead)}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-emerald-600 font-bold text-xl group-hover:bg-emerald-600 group-hover:text-white transition-all shrink-0">
                      {lead.name?.substring(0, 2).toUpperCase() || "L"}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-slate-800 text-lg">{lead.name}</h3>
                        <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-full border ${getStatusStyles(lead.status)}`}>
                          {lead.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-slate-400 text-sm">
                        <span className="flex items-center gap-1.5"><Mail size={14}/> {lead.email || 'Sin email'}</span>
                        {lead.phone && <span className="flex items-center gap-1.5"><Phone size={14}/> {lead.phone}</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end gap-2 border-t md:border-t-0 pt-3 md:pt-0">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openComposer(lead, 'whatsapp'); }}
                        className="p-3 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-all"
                        title="Enviar WhatsApp"
                      >
                        <MessageCircle size={20} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); openComposer(lead, 'email'); }}
                        className="p-3 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all"
                        title="Enviar Email"
                      >
                        <Mail size={20} />
                      </button>
                    </div>
                    <div className="h-8 w-px bg-slate-100 mx-2 hidden md:block"></div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </div>
              ))}
              {filteredLeads.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                  <p className="text-slate-400 font-medium">No se encontraron leads con ese criterio.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <CreateLeadModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={() => {
          fetchLeads();
          showMsg('success', '¡Completado!', 'El nuevo lead ha sido creado con éxito.');
        }} 
      />
      
      {selectedLead && (
        <LeadDetailModal 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)} 
          onUpdate={(deleted?: boolean) => {
            fetchLeads();
            if (deleted) {
              showMsg('success', 'Lead eliminado', 'El cliente ha sido borrado de la base de datos.');
            } else {
              showMsg('info', 'Lead actualizado', 'Los cambios se han guardado correctamente.');
            }
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
          onSentSuccess={() => {
            fetchLeads();
            showMsg('success', 'Mensaje enviado', 'La comunicación se ha registrado correctamente.');
          }}
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