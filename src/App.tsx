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
  MapPin, 
  Clock, 
  ChevronRight, 
  CheckCircle, 
  X,
  Send,
  MoreVertical,
  Trash2,
  Edit2,
  Download
} from 'lucide-react';
// Importamos el cliente de Supabase
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

const AVAILABLE_DOCS = [
  { id: 'd1', name: 'Plano General Mirapinos', category: 'General', url: '#' },
  { id: 'd2', name: 'Memoria de Calidades Olivo', category: 'Olivo', url: '#' },
  { id: 'd3', name: 'Plano Planta Baja Arce', category: 'Arce', url: '#' },
  { id: 'd4', name: 'Plano Planta Alta Arce', category: 'Arce', url: '#' },
  { id: 'd5', name: 'Forma de Pago Estándar', category: 'Financiero', url: '#' },
];

// Generador local por si la BD de inventario está vacía
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'pipeline' | 'inventory'>('dashboard');
  
  // ESTADOS DE DATOS
  const [leads, setLeads] = useState<Lead[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [inventory, setInventory] = useState<InventoryUnit[]>([]);
  
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
      const { data: leadsData, error: lError } = await supabase
        .from('leads')
        .select('*')
        .order('createdAt', { ascending: false });

      if (lError) throw lError;
      if (leadsData) setLeads(leadsData);

      // 2. Cargar Eventos
      const { data: eventsData, error: eError } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (eError) throw eError;
      if (eventsData) setEvents(eventsData);

      // 3. Cargar Inventario (o usar local si falla/está vacío)
      const { data: invData, error: iError } = await supabase
        .from('inventory')
        .select('*')
        .order('id', { ascending: true });

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

  // --- FUNCIONES DE PERSISTENCIA (SUPABASE) ---

  const addLead = async (newLead: Omit<Lead, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([newLead])
        .select();

      if (error) throw error;

      if (data) {
        setLeads([data[0], ...leads]);
        setIsAddLeadOpen(false);
        // Opcional: mostrar notificación de éxito
      }
    } catch (error: any) {
      console.error("Error guardando cliente:", error);
      alert("Error al guardar cliente: " + error.message);
    }
  };

  const updateLeadStage = async (leadId: string, newStage: PipelineStage) => {
    try {
      // Optimistic update (actualizar UI antes de confirmar)
      const oldLeads = [...leads];
      setLeads(leads.map(l => l.id === leadId ? { ...l, stage: newStage } : l));

      const { error } = await supabase
        .from('leads')
        .update({ stage: newStage })
        .eq('id', leadId);

      if (error) {
        setLeads(oldLeads); // Revertir si falla
        throw error;
      }
    } catch (error: any) {
      alert("Error actualizando etapa: " + error.message);
    }
  };

  const addEvent = async (newEvent: Omit<Event, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([newEvent])
        .select();

      if (error) throw error;

      if (data) {
        setEvents([data[0], ...events]);
      }
    } catch (error: any) {
      console.error("Error guardando evento:", error);
      alert("Error al guardar evento: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
        <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Cargando datos del CRM...</p>
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
          <button className="flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-colors w-full px-2">
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
          </h2>
          
          <div className="flex items-center gap-4">
             <button 
                onClick={() => setIsAddLeadOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm active:scale-95">
                <Plus size={18} /> Nuevo Cliente
             </button>
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
            />
          )}

          {activeTab === 'pipeline' && (
            <PipelineView leads={leads} onDragLead={updateLeadStage} onSelectLead={(id) => { setActiveTab('leads'); setSelectedLeadId(id); }} />
          )}

          {activeTab === 'inventory' && (
            <InventoryView inventory={inventory} />
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

// --- SUBCOMPONENTES ---

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-8 border-b border-slate-50 pb-4">Estado del Embudo</h3>
          <div className="space-y-6">
            {['Prospecto', 'Visitando', 'Interés', 'Cierre'].map((stage) => {
              const count = leads.filter(l => l.stage === stage).length;
              const pct = (count / (leads.length || 1)) * 100;
              return (
                <div key={stage}>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-bold text-slate-600 uppercase tracking-widest">{stage}</span>
                    <span className="text-slate-400 font-bold">{count} clientes</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-8 border-b border-slate-50 pb-4">Actividad Reciente</h3>
          <div className="space-y-4">
            {events.slice(0, 5).map(event => (
              <div key={event.id} className="flex gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100 group">
                <div className="text-slate-300 mt-1 group-hover:text-emerald-500 transition-colors"><Clock size={18}/></div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{event.type}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{event.description}</p>
                  <p className="text-[9px] text-slate-300 font-black mt-2 uppercase tracking-widest">{new Date(event.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadsListView({ leads, onSelectLead, searchTerm, setSearchTerm, filterStage, setFilterStage, filterRating, setFilterRating }: any) {
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

        <select className="px-4 py-2.5 border-none shadow-sm rounded-2xl bg-white text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none cursor-pointer" value={filterRating} onChange={(e) => setFilterRating(Number(e.target.value))}>
          <option value={0}>CUALQUIER RATING</option>
          <option value={3}>3+ ESTRELLAS</option>
          <option value={5}>5 ESTRELLAS</option>
        </select>
      </div>

      <div className="overflow-auto flex-1">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] sticky top-0 z-10">
            <tr>
              <th className="px-8 py-5">Cliente</th>
              <th className="px-6 py-5">Contacto</th>
              <th className="px-6 py-5">Origen</th>
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
                  <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">{new Date(lead.createdAt).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-5 text-slate-600">
                  <div className="flex items-center gap-2 text-xs font-bold mb-1"><Phone size={14} className="text-emerald-500"/> {lead.phone}</div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium"><Mail size={14} className="text-slate-300"/> {lead.email}</div>
                </td>
                <td className="px-6 py-5">
                  <span className="px-3 py-1 bg-white text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-100 shadow-sm">{lead.source}</span>
                </td>
                <td className="px-6 py-5">
                   <StageBadge stage={lead.stage} />
                </td>
                <td className="px-6 py-5">
                  <div className="flex text-amber-400 gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < lead.rating ? "currentColor" : "none"} className={i < lead.rating ? "" : "text-slate-100"} />
                    ))}
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

function LeadDetailView({ lead, onBack, events, onAddEvent, onUpdateStage }: { lead: Lead, onBack: () => void, events: Event[], onAddEvent: any, onUpdateStage: (s: PipelineStage) => void }) {
  const [activeSubTab, setActiveSubTab] = useState<'agenda' | 'docs'>('agenda');
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  const handleSendDocs = () => {
    if (selectedDocs.length === 0) return;
    const docNames = AVAILABLE_DOCS.filter(d => selectedDocs.includes(d.id)).map(d => d.name).join(', ');
    
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
           <div className="text-right">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Cualificación</p>
              <div className="flex text-amber-400 gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} size={16} fill={i < lead.rating ? "currentColor" : "none"} className={i < lead.rating ? "" : "text-slate-200"} />)}
              </div>
           </div>
           <div className="h-10 w-[1px] bg-slate-200"></div>
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
               <textarea className="w-full text-sm border-none rounded-2xl bg-slate-50 p-5 h-48 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all placeholder:text-slate-300 shadow-inner font-medium text-slate-600" placeholder="Añade detalles sobre la visita, presupuesto o necesidades específicas..."></textarea>
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
                   <div className="flex justify-between items-center mb-10">
                      <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-[0.2em]">Timeline</h4>
                      <div className="flex gap-3">
                        <button className="bg-white text-slate-600 border border-slate-200 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all shadow-sm active:scale-95">+ Llamada</button>
                        <button className="bg-white text-slate-600 border border-slate-200 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all shadow-sm active:scale-95">+ Cita</button>
                      </div>
                   </div>
                   
                   <div className="relative border-l-2 border-slate-200 ml-3 space-y-12 pb-10">
                      {events.map(event => (
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
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                      <div className="relative z-10">
                        <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Gestión Documental</p>
                        <p className="text-white text-sm font-bold opacity-90 max-w-xs leading-relaxed">Envía planos y memorias de calidades al instante.</p>
                      </div>
                      <button 
                        onClick={() => setShowDocModal(true)}
                        className="relative z-10 bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-400 hover:text-white transition-all shadow-xl active:scale-95"
                      >
                         <Send size={16} /> Enviar Dossier
                      </button>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-5">
                      {events.filter(e => e.type === 'Envio Documentacion').map(e => (
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
                            <button className="text-slate-300 hover:text-emerald-600 transition-colors"><Download size={22}/></button>
                         </div>
                      ))}
                      {events.filter(e => e.type === 'Envio Documentacion').length === 0 && (
                         <div className="text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                               <FileText className="text-slate-200" size={36} />
                            </div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Bandeja de envíos vacía</p>
                         </div>
                      )}
                   </div>
                </div>
             )}
          </div>
        </div>
      </div>

      {/* Modal Envío Docs */}
      {showDocModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-6 backdrop-blur-md">
           <div className="bg-white rounded-[40px] shadow-2xl max-w-2xl w-full overflow-hidden border border-white/20 animate-in zoom-in-95 duration-200">
              <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
                 <div>
                    <h3 className="text-2xl font-black uppercase tracking-[0.1em]">Dossier Digital</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Selección para {lead.firstName}</p>
                 </div>
                 <button onClick={() => setShowDocModal(false)} className="text-slate-400 hover:text-white transition-all"><X size={32}/></button>
              </div>
              <div className="p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 max-h-[400px] overflow-auto pr-2">
                   {AVAILABLE_DOCS.map(doc => (
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
                         <div>
                            <div className="text-sm font-black text-slate-800 uppercase tracking-tighter">{doc.name}</div>
                            <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">{doc.category}</div>
                         </div>
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
                      <Send size={18} /> Procesar Dossier ({selectedDocs.length})
                   </button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function PipelineView({ leads, onDragLead, onSelectLead }: { leads: Lead[], onDragLead: any, onSelectLead: any }) {
  const stages: PipelineStage[] = ['Prospecto', 'Visitando', 'Interés', 'Cierre'];

  return (
    <div className="flex h-full gap-8 overflow-x-auto pb-8">
      {stages.map(stage => (
        <div key={stage} className="flex-1 min-w-[340px] bg-slate-100/50 rounded-[40px] flex flex-col max-h-full border border-slate-200/50 shadow-inner">
           <div className="p-6 flex justify-between items-center border-b border-slate-200 bg-white/50 rounded-t-[40px] backdrop-blur-sm sticky top-0 z-10">
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em]">{stage}</span>
              <span className="bg-white px-4 py-1.5 rounded-full text-[10px] font-black text-slate-400 shadow-sm border border-slate-100">
                 {leads.filter((l: Lead) => l.stage === stage).length}
              </span>
           </div>
           <div className="p-5 flex-1 overflow-auto space-y-5">
              {leads.filter((l: Lead) => l.stage === stage).map((lead: Lead) => (
                 <div key={lead.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 hover:shadow-2xl hover:border-emerald-300 cursor-pointer transition-all group relative active:scale-95" onClick={() => onSelectLead(lead.id)}>
                    <div className="flex justify-between items-start mb-4">
                       <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">{lead.source}</span>
                       <div className="flex text-amber-400 items-center gap-1">
                          <Star size={12} fill="currentColor" />
                          <span className="text-[10px] font-black text-slate-600">{lead.rating}</span>
                       </div>
                    </div>
                    <div className="font-black text-slate-800 tracking-tighter text-lg mb-1">{lead.firstName} {lead.lastName}</div>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6 opacity-70 truncate">{lead.email}</div>
                    
                    <div className="flex justify-between items-center pt-5 border-t border-slate-50">
                       <div className="w-8 h-8 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[9px] font-black text-emerald-700 shadow-sm">MP</div>
                       
                       <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          {stage !== 'Prospecto' && <button onClick={() => onDragLead(lead.id, stages[stages.indexOf(stage)-1])} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-800 transition-colors shadow-sm bg-white border border-slate-100"><ChevronRight size={18} className="rotate-180"/></button>}
                          {stage !== 'Cierre' && <button onClick={() => onDragLead(lead.id, stages[stages.indexOf(stage)+1])} className="p-2 bg-emerald-50 hover:bg-emerald-600 rounded-xl text-emerald-600 hover:text-white transition-all shadow-md"><ChevronRight size={18} /></button>}
                       </div>
                    </div>
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
              <div 
                key={unit.id}
                className={`aspect-square rounded-[28px] flex flex-col items-center justify-center font-black text-base shadow-sm transition-all border-2 group cursor-default active:scale-90 ${
                  unit.status === 'available' ? 'bg-white border-emerald-50 text-emerald-600 hover:scale-110 hover:border-emerald-400 hover:shadow-2xl shadow-emerald-500/10' :
                  unit.status === 'reserved' ? 'bg-amber-50 border-amber-100 text-amber-600' : 
                  'bg-slate-50 border-slate-100 text-slate-300'
                }`}
              >
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
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    source: 'Web' as LeadSource,
    stage: 'Prospecto' as PipelineStage,
    rating: 3
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-6">
      <div className="grid grid-cols-2 gap-5">
        <div>
           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre</label>
           <input required type="text" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-inner" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
        </div>
        <div>
           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Apellidos</label>
           <input required type="text" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-inner" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-5">
        <div>
           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Teléfono</label>
           <input required type="tel" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-inner" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
        </div>
        <div>
           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email</label>
           <input required type="email" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-inner" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div>
           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Canal de Origen</label>
           <select className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-black text-slate-700 focus:ring-4 focus:ring-emerald-500/10 shadow-inner appearance-none cursor-pointer" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value as LeadSource})}>
              {['Web', 'RRSS', 'Idealista', 'Buzoneo', 'Referido', 'Otros'].map(s => <option key={s} value={s}>{s}</option>)}
           </select>
        </div>
        <div>
           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Calificación Inicial</label>
           <select className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-black text-slate-700 focus:ring-4 focus:ring-emerald-500/10 shadow-inner appearance-none cursor-pointer" value={formData.rating} onChange={e => setFormData({...formData, rating: Number(e.target.value)})}>
              {[1,2,3,4,5].map(v => <option key={v} value={v}>{v} Estrellas</option>)}
           </select>
        </div>
      </div>

      <div className="flex gap-5 mt-10 pt-8 border-t border-slate-50">
         <button type="button" onClick={onCancel} className="flex-1 px-5 py-4 text-slate-400 hover:text-slate-800 font-black text-[10px] uppercase tracking-widest transition-colors">Descartar</button>
         <button type="submit" className="flex-[2] px-5 py-4 bg-emerald-600 text-white hover:bg-emerald-700 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-emerald-600/30 transition-all active:scale-95">Guardar Cliente</button>
      </div>
    </form>
  );
}

// --- UI HELPERS ---

function StageBadge({ stage }: { stage: PipelineStage }) {
   const colors = {
      'Prospecto': 'bg-slate-100 text-slate-500',
      'Visitando': 'bg-blue-100 text-blue-700',
      'Interés': 'bg-amber-100 text-amber-700',
      'Cierre': 'bg-emerald-100 text-emerald-700'
   };
   return (
      <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${colors[stage]}`}>
         {stage}
      </span>
   );
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