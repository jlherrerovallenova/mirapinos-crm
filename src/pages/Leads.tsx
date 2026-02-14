import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Calendar,
  ChevronRight,
  UserPlus,
  Loader2
} from 'lucide-react';
import CreateLeadModal from '../components/leads/CreateLeadModal';
import LeadDetailModal from '../components/leads/LeadDetailModal';
import EmailComposerModal from '../components/leads/EmailComposerModal';
import { AppNotification } from '../components/Shared';
import type { Database } from '../types/supabase';

type Lead = Database['public']['Tables']['leads']['Row'];
type Document = Database['public']['Tables']['documents']['Row'];

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [availableDocs, setAvailableDocs] = useState<{name: string, url: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [emailLead, setEmailLead] = useState<Lead | null>(null);
  
  const [notification, setNotification] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, title: '', message: '', type: 'success' });

  useEffect(() => {
    fetchLeads();
    fetchDocuments();
  }, []);

  async function fetchLeads() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setLeads(data);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDocuments() {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('name, file_url')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        const formattedDocs = data.map(doc => ({
          name: doc.name,
          url: doc.file_url
        }));
        setAvailableDocs(formattedDocs);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  }

  const filteredLeads = leads.filter(lead => 
    lead.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showNotif = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, title, message, type });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-emerald-600 font-bold uppercase tracking-[0.3em] text-[10px] mb-2 text-center md:text-left">Gestión de Prospectos</p>
          <h1 className="text-4xl font-display font-bold text-slate-900 tracking-tight text-center md:text-left">Leads</h1>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-200 hover:shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95"
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
            
            <nav className="space-y-1">
              <button className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm transition-all">
                Todos los Leads
                <span className="bg-emerald-200 px-2 py-0.5 rounded-lg text-[10px]">{leads.length}</span>
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-xl text-slate-500 hover:bg-slate-50 font-medium text-sm transition-all">
                Nuevos hoy
                <span className="bg-slate-100 px-2 py-0.5 rounded-lg text-[10px]">0</span>
              </button>
            </nav>
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
                  className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex items-center justify-between cursor-pointer"
                  onClick={() => setSelectedLead(lead)}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-bold text-xl border border-slate-50 group-hover:from-emerald-500 group-hover:to-emerald-600 group-hover:text-white transition-all duration-300">
                      {lead.first_name[0]}{lead.last_name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-700 transition-colors">{lead.first_name} {lead.last_name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-slate-400 text-sm font-medium">
                        <span className="flex items-center gap-1.5"><Mail size={14}/> {lead.email}</span>
                        {lead.phone && <span className="flex items-center gap-1.5"><Phone size={14}/> {lead.phone}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEmailLead(lead);
                      }}
                      className="p-3 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-all"
                      title="Enviar email"
                    >
                      <Mail size={20} />
                    </button>
                    <button className="p-3 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition-all">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              ))}

              {filteredLeads.length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-medium italic">No se encontraron prospectos que coincidan con la búsqueda.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modales */}
      <CreateLeadModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchLeads();
          showNotif("PROSPECTO CREADO", "El nuevo lead se ha registrado correctamente.");
        }}
      />

      {selectedLead && (
        <LeadDetailModal 
          lead={selectedLead}
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={fetchLeads}
        />
      )}

      {emailLead && (
        <EmailComposerModal
          isOpen={!!emailLead}
          onClose={() => setEmailLead(null)}
          leadName={`${emailLead.first_name} ${emailLead.last_name}`}
          leadEmail={emailLead.email}
          availableDocs={availableDocs}
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