import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  LayoutDashboard, 
  Map, 
  Calendar, 
  FileText, 
  Settings, 
  Plus, 
  Search, 
  Filter, 
  Star, 
  Phone, 
  Mail, 
  Clock, 
  ChevronRight, 
  X, 
  Send, 
  Trash2, 
  Download,
  UploadCloud,
  File
} from 'lucide-react';
import { supabase } from './lib/supabase';

/**
 * TIPOS DE DATOS
 */
type PipelineStage = 'Prospecto' | 'Visitando' | 'Interés' | 'Cierre';
type LeadSource = 'Web' | 'RRSS' | 'Idealista' | 'Buzoneo' | 'Referido' | 'Otros';
type EventType = 'Contacto' | 'Llamada' | 'Cita Oficina' | 'Cita Obra' | 'Reserva' | 'Envio Documentacion' | 'Otros';
type PropertyType = 'OLIVO' | 'ARCE' | 'PARCELA';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  source: LeadSource;
  stage: PipelineStage;
  rating: number;
  createdAt: string;
}

interface Event {
  id: string;
  leadId: string;
  type: EventType;
  date: string;
  description: string;
  completed: boolean;
}

interface InventoryUnit {
  id: number;
  number: string;
  type: PropertyType;
  status: 'available' | 'reserved' | 'sold';
  leadId?: string;
}

interface Document {
  id: string;
  name: string;
  category: string;
  url: string;
  created_at?: string;
}

// Generador local por si la BD de inventario está vacía (fallback)
const generateInventory = (): InventoryUnit[] => {
  const units: InventoryUnit[] = [];
  for (let i = 1; i <= 13; i++) units.push({ id: i, number: `${i}`, type: 'OLIVO', status: i === 2 ? 'reserved' : 'available' });
  for (let i = 14; i <= 35; i++) units.push({ id: i, number: `${i}`, type: 'ARCE', status: i === 20 ? 'sold' : 'available' });
  for (let i = 1; i <= 11; i++) units.push({ id: 100+i, number: `P-${i}`, type: 'PARCELA', status: 'available' });
  return units;
};

/**
 * COMPONENTE PRINCIPAL
 */
export default function MirapinosCRM() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'pipeline' | 'inventory' | 'settings'>('dashboard');
  
  // ESTADOS DE DATOS
  const [leads, setLeads] = useState<Lead[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [inventory, setInventory] = useState<InventoryUnit[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // ESTADOS DE UI
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState<PipelineStage | 'All'>('All');
  const [filterRating, setFilterRating] = useState<number | 0>(0);

  // --- CARGA INICIAL DE DATOS ---
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // 1. Cargar Clientes
      const { data: leadsData } = await supabase.from('leads').select('*').order('createdAt', { ascending: false });
      if (leadsData) setLeads(leadsData);

      // 2. Cargar Eventos
      const { data: eventsData } = await supabase.from('events').select('*').order('date', { ascending: false });
      if (eventsData) setEvents(eventsData);

      // 3. Cargar Documentos (NUEVO)
      const { data: docsData } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
      if (docsData) setDocuments(docsData);

      // 4. Cargar Inventario
      const { data: invData } = await supabase.from('inventory').select('*').order('id', { ascending: true });
      if (invData && invData.length > 0) {
        setInventory(invData);
      } else {
        setInventory(generateInventory());
      }

    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const fullName = (lead.firstName + ' ' + lead.lastName).toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                           lead.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           lead.phone.includes(searchTerm);
      const matchesStage = filterStage === 'All' || lead.stage === filterStage;
      const matchesRating = filterRating === 0 || lead.rating >= filterRating;
      return matchesSearch && matchesStage && matchesRating;
    });
  }, [leads, searchTerm, filterStage, filterRating]);

  // --- FUNCIONES DE PERSISTENCIA ---

  const addLead = async (newLead: Omit<Lead, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase.from('leads').insert([newLead]).select();
      if (error) throw error;
      if (data) {
        setLeads([data[0], ...leads]);
        setIsAddLeadOpen(false);
      }
    } catch (error: any) {
      alert("Error al guardar cliente: " + error.message);
    }
  };

  const updateLeadStage = async (leadId: string, newStage: PipelineStage) => {
    const oldLeads = [...leads];
    setLeads(leads.map(l => l.id === leadId ? { ...l, stage: newStage } : l));
    const { error } = await supabase.from('leads').update({ stage: newStage }).eq('id', leadId);
    if (error) setLeads(oldLeads); // Revertir si falla
  };

  const addEvent = async (newEvent: Omit<Event, 'id'>) => {
    const { data, error } = await supabase.from('events').insert([newEvent]).select();
    if (!error && data) setEvents([data[0], ...events]);
  };

  // --- FUNCIÓN DE SUBIDA DE ARCHIVOS ---
  const uploadDocument = async (file: File, category: string, name: string) => {
    try {
      // 1. Preparar nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${category}/${fileName}`;

      // 2. Subir al Bucket 'crm-docs'
      const { error: uploadError } = await supabase.storage.from('crm-docs').upload(filePath, file);
      if (uploadError) throw uploadError;

      // 3. Obtener URL pública
      const { data: { publicUrl } } = supabase.storage.from('crm-docs').getPublicUrl(filePath);

      // 4. Guardar referencia en Base de Datos
      const { data: docData, error: dbError } = await supabase
        .from('documents')
        .insert([{ name, category, url: publicUrl }])
        .select();

      if (dbError) throw dbError;
      
      // 5. Actualizar estado local
      if (docData) setDocuments([docData[0], ...documents]);
      
      return true;
    } catch (error: any) {
      console.error("Error subiendo documento:", error);
      alert("Error en la subida: " + error.message);
      return false;
    }
  };

  const deleteDocument = async (id: string) => {
    if(!confirm("¿Seguro que quieres borrar este documento?")) return;
    
    // Solo borramos el registro de la BD por simplicidad (el archivo queda en storage)
    // Para borrar de storage necesitaríamos guardar el path también.
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (!error) setDocuments(documents.filter(d => d.id !== id));
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
        <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Cargando CRM...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-slate-800">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold tracking-tight text-emerald-400">Mirapinos</h1>
          <p className="text-xs text-slate-400 mt-1">CRM Inmobiliario</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={<Users size={20} />} label="Clientes" active={activeTab === 'leads'} onClick={() => { setActiveTab('leads'); setSelectedLeadId(null); }} />
          <SidebarItem icon={<Calendar size={20} />} label="Túnel de Ventas" active={activeTab === 'pipeline'} onClick={() => setActiveTab('pipeline')} />
          <SidebarItem icon={<Map size={20} />} label="Inventario" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 text-sm transition-colors w-full px-2 py-2 rounded-lg ${activeTab === 'settings' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <Settings size={18} /> Configuración
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-xl font-semibold text-slate-700 uppercase tracking-widest text-sm">
            {activeTab === 'dashboard' && 'Panel Principal'}
            {activeTab === 'leads' && 'Gestión de Clientes'}
            {activeTab === 'pipeline' && 'Túnel de Ventas'}
            {activeTab === 'inventory' && 'Inventario de Promoción'}
            {activeTab === 'settings' && 'Gestión Documental'}
          </h2>
          
          <div className="flex items-center gap-4">
             {activeTab === 'leads' && (
               <button 
                  onClick={() => setIsAddLeadOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm active:scale-95">
                  <Plus size={18} /> Nuevo Cliente
               </button>
             )}
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-auto p-8">
          
          {activeTab === 'dashboard' && <DashboardView leads={leads} inventory={inventory} events={events} />}
          
          {activeTab === 'leads' && !selectedLeadId && (
            <LeadsListView 
              leads={filteredLeads} 
              onSelectLead={setSelectedLeadId}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterStage={filterStage}
              setFilterStage={setFilterStage}
              filterRating={filterRating}
              setFilterRating={setFilterRating}
            />
          )}

          {activeTab === 'leads' && selectedLeadId && (
            <LeadDetailView 
              lead={leads.find(l => l.id === selectedLeadId)!} 
              onBack={() => setSelectedLeadId(null)}
              events={events.filter(e => e.leadId === selectedLeadId)}
              onAddEvent={addEvent}
              onUpdateStage={(stage) => updateLeadStage(selectedLeadId, stage)}
              documents={documents}
            />
          )}

          {activeTab === 'pipeline' && (
            <PipelineView leads={leads} onDragLead={updateLeadStage} onSelectLead={(id) => { setActiveTab('leads'); setSelectedLeadId(id); }} />
          )}

          {activeTab === 'inventory' && (
            <InventoryView inventory={inventory} />
          )}

          {activeTab === 'settings' && (
            <SettingsView documents={documents} onUpload={uploadDocument} onDelete={deleteDocument} />
          )}

        </div>
      </main>

      {/* MODAL ADD LEAD */}
      {isAddLeadOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[500px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Registrar Nuevo Cliente</h3>
              <button onClick={() => setIsAddLeadOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={24} /></button>
            </div>
            <AddLeadForm onSubmit={addLead} onCancel={() => setIsAddLeadOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

// --- VISTA DE CONFIGURACIÓN / GESTIÓN DOCUMENTAL ---
function SettingsView({ documents, onUpload, onDelete }: { documents: Document[], onUpload: any, onDelete: any }) {
  const [isUploading, setIsUploading] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('General');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFile || !newName) return;
    setIsUploading(true);
    const success = await onUpload(newFile, newCategory, newName);
    setIsUploading(false);
    if (success) {
      setNewFile(null);
      setNewName('');
      alert("Documento subido correctamente");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Formulario de Subida */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <UploadCloud className="text-emerald-600" /> Subir Nuevo Documento
          </h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Archivo (PDF, IMG...)</label>
              <input 
                type="file" 
                onChange={e => setNewFile(e.target.files ? e.target.files[0] : null)}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nombre Visible</label>
              <input 
                type="text" 
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Ej: Plano Planta Baja"
                className="w-full p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Categoría</label>
              <select 
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="w-full p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="General">General</option>
                <option value="Olivo">Olivo (Adosado)</option>
                <option value="Arce">Arce (Pareado)</option>
                <option value="Financiero">Financiero</option>
              </select>
            </div>
            <button 
              type="submit" 
              disabled={isUploading}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isUploading ? 'Subiendo...' : 'Guardar en la Nube'}
            </button>
          </form>
        </div>
      </div>

      {/* Lista de Documentos */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 bg-slate-50/50">
            <h3 className="font-bold text-slate-700">Documentos Disponibles para Envíos ({documents.length})</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {documents.length === 0 && <p className="p-8 text-center text-slate-400">No hay documentos subidos aún.</p>}
            {documents.map(doc => (
              <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <FileText size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{doc.name}</p>
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">{doc.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a 
                    href={doc.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Ver/Descargar"
                  >
                    <Download size={18} />
                  </a>
                  <button 
                    onClick={() => onDelete(doc.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- DETALLE DE CLIENTE CON GESTIÓN DOCUMENTAL ---
function LeadDetailView({ lead, onBack, events, onAddEvent, onUpdateStage, documents }: any) {
  const [activeSubTab, setActiveSubTab] = useState<'agenda' | 'docs'>('agenda');
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  const handleSendDocs = () => {
    if (selectedDocs.length === 0) return;
    const docNames = documents.filter((d:any) => selectedDocs.includes(d.id)).map((d:any) => d.name).join(', ');
    
    onAddEvent({
      leadId: lead.id,
      type: 'Envio Documentacion',
      date: new Date().toISOString(),
      description: `Enviado: ${docNames}`,
      completed: true
    });
    
    setShowDocModal(false);
    setSelectedDocs([]);
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
      <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-start">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-3 bg-white hover:shadow-lg rounded-2xl transition-all group border border-slate-100">
            <ChevronRight className="rotate-180 text-slate-400 group-hover:text-slate-900" size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter">{lead.firstName} {lead.lastName}</h2>
              <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em]">{lead.id.slice(0, 5)}</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400 mt-3 font-bold">
              <span className="flex items-center gap-2"><Phone size={16} className="text-emerald-500"/> {lead.phone}</span>
              <span className="flex items-center gap-2"><Mail size={16} className="text-emerald-500"/> {lead.email}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
           <select 
              value={lead.stage}
              onChange={(e) => onUpdateStage(e.target.value as PipelineStage)}
              className="bg-slate-900 text-white text-[10px] font-black rounded-xl p-4 uppercase tracking-[0.2em] focus:ring-4 focus:ring-emerald-500/20 cursor-pointer shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-colors border-none outline-none appearance-none text-center min-w-[140px]"
            >
              <option value="Prospecto">Prospecto</option>
              <option value="Visitando">Visitando</option>
              <option value="Interés">Interés</option>
              <option value="Cierre">Cierre</option>
            </select>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/3 border-r border-slate-50 p-10 overflow-auto bg-white">
          <h3 className="font-black text-slate-800 mb-8 uppercase text-[10px] tracking-[0.3em] border-l-4 border-emerald-500 pl-4">Perfil Cliente</h3>
          <div className="space-y-8">
            <InfoRow label="Canal de Entrada" value={lead.source} />
            <InfoRow label="Registro en Sistema" value={new Date(lead.createdAt).toLocaleDateString()} />
            <InfoRow label="Interés Principal" value="Modelo Olivo / Adosada" />
            <div className="pt-8 border-t border-slate-50">
               <label className="text-[9px] font-black text-slate-400 block mb-3 uppercase tracking-widest">Notas Internas</label>
               <textarea className="w-full text-sm border-none rounded-2xl bg-slate-50 p-5 h-48 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all placeholder:text-slate-300 shadow-inner font-medium text-slate-600" placeholder="Añade detalles sobre la visita..."></textarea>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-slate-50/50">
          <div className="flex bg-white px-10 shadow-sm border-b border-slate-50">
            <button className={`py-6 mr-10 text-[10px] font-black uppercase tracking-[0.2em] border-b-[3px] transition-all ${activeSubTab === 'agenda' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-300 hover:text-slate-500'}`} onClick={() => setActiveSubTab('agenda')}>Historial y Actividad</button>
            <button className={`py-6 text-[10px] font-black uppercase tracking-[0.2em] border-b-[3px] transition-all ${activeSubTab === 'docs' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-300 hover:text-slate-500'}`} onClick={() => setActiveSubTab('docs')}>Documentación Enviada</button>
          </div>

          <div className="flex-1 p-10 overflow-auto">
             {activeSubTab === 'agenda' && (
                <div className="max-w-3xl">
                   <div className="relative border-l-2 border-slate-200 ml-3 space-y-12 pb-10">
                      {events.map((event:any) => (
                        <div key={event.id} className="relative pl-12">
                           <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full border-4 border-white shadow-md ${event.type === 'Envio Documentacion' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                           <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
                              <div className="flex justify-between items-start mb-3">
                                 <span className="font-black text-[9px] text-slate-800 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg">{event.type}</span>
                                 <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{new Date(event.date).toLocaleString()}</span>
                              </div>
                              <p className="text-sm text-slate-600 leading-relaxed font-medium">{event.description}</p>
                           </div>
                        </div>
                      ))}
                      {events.length === 0 && <p className="pl-12 text-slate-400 italic text-sm font-medium">No se han registrado eventos todavía...</p>}
                   </div>
                </div>
             )}

             {activeSubTab === 'docs' && (
                <div className="max-w-3xl">
                   <div className="flex justify-between items-center mb-10 p-8 bg-gradient-to-br from-blue-900 to-slate-900 rounded-[32px] shadow-2xl shadow-blue-900/20 relative overflow-hidden">
                      <div className="relative z-10">
                        <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Gestión Documental</p>
                        <p className="text-white text-sm font-bold opacity-90 max-w-xs leading-relaxed">Envía planos y memorias al instante.</p>
                      </div>
                      <button 
                        onClick={() => setShowDocModal(true)}
                        className="relative z-10 bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-400 hover:text-white transition-all shadow-xl active:scale-95"
                      >
                         <Send size={16} /> Enviar Dossier
                      </button>
                   </div>
                   <div className="grid grid-cols-1 gap-5">
                      {events.filter((e:any) => e.type === 'Envio Documentacion').map((e:any) => (
                         <div key={e.id} className="flex items-center gap-8 p-6 bg-white rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                            <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 shadow-inner group-hover:scale-110 transition-transform">
                               <FileText size={28} />
                            </div>
                            <div className="flex-1">
                               <div className="flex justify-between items-center mb-2">
                                  <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Dossier Enviado</p>
                                  <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">{new Date(e.date).toLocaleDateString()}</p>
                               </div>
                               <p className="text-sm text-slate-500 font-medium truncate max-w-md">{e.description}</p>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             )}
          </div>
        </div>
      </div>

      {showDocModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-6 backdrop-blur-md">
           <div className="bg-white rounded-[40px] shadow-2xl max-w-2xl w-full overflow-hidden border border-white/20 animate-in zoom-in-95 duration-200">
              <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
                 <div>
                    <h3 className="text-2xl font-black uppercase tracking-[0.1em]">Dossier Digital</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Selecciona para {lead.firstName}</p>
                 </div>
                 <button onClick={() => setShowDocModal(false)} className="text-slate-400 hover:text-white transition-all"><X size={32}/></button>
              </div>
              <div className="p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 max-h-[400px] overflow-auto pr-2">
                   {documents.length === 0 && <p className="col-span-2 text-slate-400 text-center">No hay documentos disponibles. Ve a Configuración para subir uno.</p>}
                   {documents.map((doc: any) => (
                      <label key={doc.id} className={`flex items-center gap-5 p-5 rounded-3xl border-2 cursor-pointer transition-all ${selectedDocs.includes(doc.id) ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}>
                         <input 
                            type="checkbox" 
                            className="w-6 h-6 text-emerald-600 rounded-lg border-slate-300 focus:ring-emerald-500"
                            checked={selectedDocs.includes(doc.id)}
                            onChange={(e) => {
                               if(e.target.checked) setSelectedDocs([...selectedDocs, doc.id]);
                               else setSelectedDocs(selectedDocs.filter(id => id !== doc.id));
                            }}
                         />
                         <div className="flex-1">
                            <div className="text-sm font-black text-slate-800 uppercase tracking-tighter truncate">{doc.name}</div>
                            <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">{doc.category}</div>
                         </div>
                         <a href={doc.url} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-emerald-500" onClick={(e) => e.stopPropagation()}><File size={16}/></a>
                      </label>
                   ))}
                </div>
                <div className="flex gap-5">
                   <button onClick={() => setShowDocModal(false)} className="flex-1 px-8 py-5 text-slate-400 hover:text-slate-800 font-black text-[10px] uppercase tracking-widest transition-colors">Cancelar</button>
                   <button 
                      onClick={handleSendDocs}
                      disabled={selectedDocs.length === 0}
                      className="flex-[2] px-8 py-5 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-4 shadow-2xl shadow-emerald-600/20 active:scale-95 transition-all"
                   >
                      <Send size={18} /> Procesar ({selectedDocs.length})
                   </button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

// --- SUBCOMPONENTES GENÉRICOS ---
function SidebarItem({ icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${active ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
    >
      {icon}
      {label}
    </button>
  );
}

function DashboardView({ leads, inventory, events }: { leads: Lead[], inventory: InventoryUnit[], events: Event[] }) {
  const sold = inventory.filter(i => i.status === 'sold').length;
  const reserved = inventory.filter(i => i.status === 'reserved').length;
  const available = inventory.length - sold - reserved;
  const pendingEvents = events.filter(e => !e.completed).length;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Viviendas Disponibles" value={available} total={inventory.length} color="text-emerald-600" />
        <StatCard title="Reservas Activas" value={reserved} subtext="En proceso de firma" color="text-amber-500" />
        <StatCard title="Ventas Cerradas" value={sold} subtext="Contratos firmados" color="text-blue-600" />
        <StatCard title="Agenda Pendiente" value={pendingEvents} subtext="Eventos activos" color="text-rose-500" />
      </div>
    </div>
  );
}

function LeadsListView({ leads, onSelectLead, searchTerm, setSearchTerm, filterStage, setFilterStage }: any) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-slate-50 flex gap-4 flex-wrap bg-slate-50/50 items-center">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-4 top-3 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, email o teléfono..." 
            className="w-full pl-12 pr-4 py-2.5 bg-white border-none rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:outline-none text-sm transition-all shadow-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="px-4 py-2.5 border-none shadow-sm rounded-2xl bg-white text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none cursor-pointer" value={filterStage} onChange={(e) => setFilterStage(e.target.value)}>
          <option value="All">TODAS LAS ETAPAS</option>
          <option value="Prospecto">PROSPECTO</option>
          <option value="Visitando">VISITANDO</option>
          <option value="Interés">INTERÉS</option>
          <option value="Cierre">CIERRE</option>
        </select>
      </div>
      <div className="overflow-auto flex-1">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] sticky top-0 z-10">
            <tr>
              <th className="px-8 py-5">Cliente</th>
              <th className="px-6 py-5">Contacto</th>
              <th className="px-6 py-5">Etapa</th>
              <th className="px-6 py-5">Rating</th>
              <th className="px-6 py-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {leads.map((lead: Lead) => (
              <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => onSelectLead(lead.id)}>
                <td className="px-8 py-5">
                  <div className="font-black text-slate-800 tracking-tight text-base">{lead.firstName} {lead.lastName}</div>
                </td>
                <td className="px-6 py-5 text-slate-600">
                  <div className="flex items-center gap-2 text-xs font-bold mb-1"><Phone size={14} className="text-emerald-500"/> {lead.phone}</div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium"><Mail size={14} className="text-slate-300"/> {lead.email}</div>
                </td>
                <td className="px-6 py-5">
                   <StageBadge stage={lead.stage} />
                </td>
                <td className="px-6 py-5">
                  <div className="flex text-amber-400 gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < lead.rating ? "currentColor" : "none"} className={i < lead.rating ? "" : "text-slate-100"} />)}
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <button className="bg-white border border-slate-100 text-slate-400 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm group-hover:shadow-lg">
                    Ver Ficha
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PipelineView({ leads, onDragLead, onSelectLead }: any) {
  const stages: PipelineStage[] = ['Prospecto', 'Visitando', 'Interés', 'Cierre'];
  return (
    <div className="flex h-full gap-8 overflow-x-auto pb-8">
      {stages.map(stage => (
        <div key={stage} className="flex-1 min-w-[340px] bg-slate-100/50 rounded-[40px] flex flex-col max-h-full border border-slate-200/50 shadow-inner">
           <div className="p-6 flex justify-between items-center border-b border-slate-200 bg-white/50 rounded-t-[40px] backdrop-blur-sm sticky top-0 z-10">
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em]">{stage}</span>
              <span className="bg-white px-4 py-1.5 rounded-full text-[10px] font-black text-slate-400 shadow-sm border border-slate-100">
                 {leads.filter((l: any) => l.stage === stage).length}
              </span>
           </div>
           <div className="p-5 flex-1 overflow-auto space-y-5">
              {leads.filter((l: any) => l.stage === stage).map((lead: any) => (
                 <div key={lead.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 hover:shadow-2xl hover:border-emerald-300 cursor-pointer transition-all group relative active:scale-95" onClick={() => onSelectLead(lead.id)}>
                    <div className="font-black text-slate-800 tracking-tighter text-lg mb-1">{lead.firstName} {lead.lastName}</div>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6 opacity-70 truncate">{lead.email}</div>
                 </div>
              ))}
           </div>
        </div>
      ))}
    </div>
  );
}

function InventoryView({ inventory }: { inventory: InventoryUnit[] }) {
  const types: PropertyType[] = ['OLIVO', 'ARCE', 'PARCELA'];
  return (
    <div className="space-y-16 max-w-7xl pb-10">
      <div className="flex gap-10 p-8 bg-white rounded-[40px] shadow-sm border border-slate-100 inline-flex">
        <div className="flex items-center gap-4"><div className="w-5 h-5 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/30"></div><span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Disponible</span></div>
        <div className="flex items-center gap-4"><div className="w-5 h-5 bg-amber-500 rounded-xl shadow-lg shadow-amber-500/30"></div><span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Reservado</span></div>
        <div className="flex items-center gap-4"><div className="w-5 h-5 bg-slate-200 rounded-xl"></div><span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Vendido</span></div>
      </div>
      {types.map(type => (
        <section key={type} className="animate-in slide-in-from-bottom-8 duration-700">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.4em] mb-8 flex items-center gap-6">
             {type === 'OLIVO' ? 'Modelos Olivo (Adosadas)' : type === 'ARCE' ? 'Modelos Arce (Pareadas)' : 'Parcelas Autopromoción'}
             <div className="h-[1px] flex-1 bg-slate-100"></div>
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-11 gap-5">
            {inventory.filter(u => u.type === type).map(unit => (
              <div key={unit.id} className={`aspect-square rounded-[28px] flex flex-col items-center justify-center font-black text-base shadow-sm transition-all border-2 group cursor-default active:scale-90 ${unit.status === 'available' ? 'bg-white border-emerald-50 text-emerald-600 hover:border-emerald-400 hover:shadow-2xl shadow-emerald-500/10' : unit.status === 'reserved' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                <span className="text-[9px] opacity-40 mb-1 tracking-tighter font-black uppercase">{unit.type[0]}</span>
                {unit.number}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function AddLeadForm({ onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '', email: '', source: 'Web' as LeadSource, stage: 'Prospecto' as PipelineStage, rating: 3 });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-6">
      <div className="grid grid-cols-2 gap-5">
        <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre</label><input required type="text" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} /></div>
        <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Apellidos</label><input required type="text" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} /></div>
      </div>
      <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email</label><input required type="email" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
      <div className="flex gap-5 mt-10 pt-8 border-t border-slate-50">
         <button type="button" onClick={onCancel} className="flex-1 px-5 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">Descartar</button>
         <button type="submit" className="flex-[2] px-5 py-4 bg-emerald-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-2xl">Guardar Cliente</button>
      </div>
    </form>
  );
}

function StageBadge({ stage }: { stage: PipelineStage }) {
   const colors = { 'Prospecto': 'bg-slate-100 text-slate-500', 'Visitando': 'bg-blue-100 text-blue-700', 'Interés': 'bg-amber-100 text-amber-700', 'Cierre': 'bg-emerald-100 text-emerald-700' };
   return <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${colors[stage]}`}>{stage}</span>;
}

function StatCard({ title, value, subtext, total, color }: any) {
   return (
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 hover:shadow-2xl hover:scale-[1.02] transition-all group">
         <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mb-4 border-l-4 border-slate-100 pl-4 group-hover:border-emerald-500 transition-all">{title}</p>
         <div className="flex items-baseline gap-2">
            <span className={`text-5xl font-black tracking-tighter ${color}`}>{value}</span>
            {total && <span className="text-base text-slate-300 font-bold">/ {total}</span>}
         </div>
         {subtext && <p className="text-[10px] text-slate-400 font-bold mt-3 uppercase tracking-tighter opacity-70">{subtext}</p>}
      </div>
   );
}

function InfoRow({ label, value }: { label: string, value: string }) {
   return (
      <div className="flex flex-col py-2">
         <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1.5">{label}</span>
         <span className="text-sm font-bold text-slate-700 tracking-tight">{value}</span>
      </div>
   );
}