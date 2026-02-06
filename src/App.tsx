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
  Download,
  ExternalLink
} from 'lucide-react';
import { supabase } from './lib/supabase';

// --- TIPOS DE DATOS ---
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

// --- DATOS ESTÁTICOS (INVENTARIO Y DOCS) ---
const AVAILABLE_DOCS = [
  { id: 'd1', name: 'Plano General Mirapinos', category: 'General', url: '#' },
  { id: 'd2', name: 'Memoria de Calidades Olivo', category: 'Olivo', url: '#' },
  { id: 'd3', name: 'Plano Planta Baja Arce', category: 'Arce', url: '#' },
  { id: 'd4', name: 'Plano Planta Alta Arce', category: 'Arce', url: '#' },
  { id: 'd5', name: 'Forma de Pago Estándar', category: 'Financiero', url: '#' },
];

const generateInventory = (): InventoryUnit[] => {
  const units: InventoryUnit[] = [];
  for (let i = 1; i <= 13; i++) units.push({ id: i, number: `${i}`, type: 'OLIVO', status: i === 2 ? 'reserved' : 'available' });
  for (let i = 14; i <= 35; i++) units.push({ id: i, number: `${i}`, type: 'ARCE', status: i === 20 ? 'sold' : 'available' });
  for (let i = 1; i <= 11; i++) units.push({ id: 100+i, number: `P-${i}`, type: 'PARCELA', status: 'available' });
  return units;
};

// --- COMPONENTE PRINCIPAL ---
export default function MirapinosCRM() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'pipeline' | 'inventory'>('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [inventory] = useState<InventoryUnit[]>(generateInventory());
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState<PipelineStage | 'All'>('All');
  const [filterRating, setFilterRating] = useState<number | 0>(0);

  // Carga inicial de datos desde Supabase
  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      setLoading(true);
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('createdAt', { ascending: false });
      
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (leadsError) throw leadsError;
      if (eventsError) throw eventsError;

      setLeads(leadsData || []);
      setEvents(eventsData || []);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const fullName = `${lead.firstName} ${lead.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                           lead.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           lead.phone.includes(searchTerm);
      const matchesStage = filterStage === 'All' || lead.stage === filterStage;
      const matchesRating = filterRating === 0 || lead.rating >= filterRating;
      return matchesSearch && matchesStage && matchesRating;
    });
  }, [leads, searchTerm, filterStage, filterRating]);

  // --- ACCIONES DE BASE DE DATOS ---
  const handleAddLead = async (newLead: Omit<Lead, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase
      .from('leads')
      .insert([newLead])
      .select();

    if (error) {
      console.error("Error al añadir cliente:", error);
      return;
    }
    if (data) {
      setLeads([data[0], ...leads]);
      setIsAddLeadOpen(false);
    }
  };

  const handleUpdateLeadStage = async (leadId: string, newStage: PipelineStage) => {
    const { error } = await supabase
      .from('leads')
      .update({ stage: newStage })
      .eq('id', leadId);

    if (error) {
      console.error("Error al actualizar estado:", error);
      return;
    }
    setLeads(leads.map(l => l.id === leadId ? { ...l, stage: newStage } : l));
  };

  const handleAddEvent = async (newEvent: Omit<Event, 'id'>) => {
    const { data, error } = await supabase
      .from('events')
      .insert([newEvent])
      .select();

    if (error) {
      console.error("Error al añadir evento:", error);
      return;
    }
    if (data) {
      setEvents([data[0], ...events]);
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
        <p className="text-slate-600 font-medium">Conectando con la base de datos...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-slate-800">
      {/* Barra Lateral */}
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
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-xl font-semibold text-slate-700 uppercase tracking-wide text-sm">
            {activeTab === 'dashboard' && 'Panel Principal'}
            {activeTab === 'leads' && 'Gestión de Clientes'}
            {activeTab === 'pipeline' && 'Túnel de Ventas'}
            {activeTab === 'inventory' && 'Inventario de Promoción'}
          </h2>
          <button 
            onClick={() => setIsAddLeadOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={18} /> Nuevo Cliente
          </button>
        </header>

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
              onAddEvent={handleAddEvent}
              onUpdateStage={(stage) => handleUpdateLeadStage(selectedLeadId, stage)}
            />
          )}

          {activeTab === 'pipeline' && (
            <PipelineView 
              leads={leads} 
              onDragLead={handleUpdateLeadStage} 
              onSelectLead={(id) => { setActiveTab('leads'); setSelectedLeadId(id); }}
            />
          )}

          {activeTab === 'inventory' && <InventoryView inventory={inventory} />}
        </div>
      </main>

      {/* Modal de Nuevo Cliente */}
      {isAddLeadOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[500px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Registrar Nuevo Cliente</h3>
              <button onClick={() => setIsAddLeadOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            <AddLeadForm onSubmit={handleAddLead} onCancel={() => setIsAddLeadOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUBCOMPONENTES ---

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

function DashboardView({ leads, inventory, events }: { leads: Lead[], inventory: InventoryUnit[], events: Event[] }) {
  const stats = [
    { label: 'Clientes Totales', value: leads.length, icon: <Users className="text-blue-600" />, color: 'bg-blue-50' },
    { label: 'Unidades Disponibles', value: inventory.filter(u => u.status === 'available').length, icon: <Map className="text-emerald-600" />, color: 'bg-emerald-50' },
    { label: 'Ventas/Reservas', value: inventory.filter(u => u.status !== 'available').length, icon: <CheckCircle className="text-amber-600" />, color: 'bg-amber-50' },
    { label: 'Tareas Pendientes', value: events.filter(e => !e.completed).length, icon: <Clock className="text-rose-600" />, color: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.color}`}>{stat.icon}</div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
            <Clock size={20} className="text-emerald-600" /> Actividad Reciente
          </h3>
          <div className="space-y-4">
            {events.slice(0, 5).map(event => (
              <div key={event.id} className="flex gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors border-l-4 border-emerald-500">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{event.type}</p>
                  <p className="text-xs text-slate-500 mt-1">{event.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-400">{new Date(event.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
            <Star size={20} className="text-amber-500" /> Clientes VIP (Rating 5)
          </h3>
          <div className="space-y-3">
            {leads.filter(l => l.rating === 5).slice(0, 5).map(lead => (
              <div key={lead.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                    {lead.firstName[0]}{lead.lastName[0]}
                  </div>
                  <span className="text-sm font-medium">{lead.firstName} {lead.lastName}</span>
                </div>
                <span className="text-xs px-2 py-1 bg-white rounded border border-gray-200 font-bold text-slate-600">{lead.stage}</span>
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
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-slate-50/50 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, email o teléfono..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <select 
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
          >
            <option value="All">Todos los estados</option>
            <option value="Prospecto">Prospecto</option>
            <option value="Visitando">Visitando</option>
            <option value="Interés">Interés</option>
            <option value="Cierre">Cierre</option>
          </select>
          <select 
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={filterRating}
            onChange={(e) => setFilterRating(Number(e.target.value))}
          >
            <option value={0}>Cualquier Rating</option>
            <option value={5}>⭐⭐⭐⭐⭐</option>
            <option value={4}>4+ estrellas</option>
            <option value={3}>3+ estrellas</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Contacto</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Rating</th>
              <th className="px-6 py-4">Origen</th>
              <th className="px-6 py-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leads.map(lead => (
              <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold shadow-sm">
                      {lead.firstName[0]}{lead.lastName[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{lead.firstName} {lead.lastName}</p>
                      <p className="text-xs text-slate-400">ID: {lead.id.slice(0,8)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-600"><Phone size={12}/> {lead.phone}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-600"><Mail size={12}/> {lead.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    lead.stage === 'Cierre' ? 'bg-emerald-100 text-emerald-700' :
                    lead.stage === 'Interés' ? 'bg-blue-100 text-blue-700' :
                    lead.stage === 'Visitando' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {lead.stage}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < lead.rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-slate-500">{lead.source}</td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => onSelectLead(lead.id)}
                    className="text-emerald-600 hover:text-emerald-800 font-bold text-xs uppercase tracking-tighter flex items-center gap-1 group-hover:gap-2 transition-all"
                  >
                    Ver detalle <ChevronRight size={14} />
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

function LeadDetailView({ lead, onBack, events, onAddEvent, onUpdateStage }: { lead: Lead, onBack: () => void, events: Event[], onAddEvent: any, onUpdateStage: any }) {
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'docs'>('timeline');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium">
        <ChevronRight className="rotate-180" size={18} /> Volver a la lista
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Ficha de Perfil */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm text-center">
            <div className="w-24 h-24 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-bold text-3xl mx-auto shadow-lg mb-4">
              {lead.firstName[0]}{lead.lastName[0]}
            </div>
            <h3 className="text-2xl font-bold text-slate-800">{lead.firstName} {lead.lastName}</h3>
            <p className="text-slate-400 text-sm mt-1">Cliente desde {new Date(lead.createdAt).toLocaleDateString()}</p>
            
            <div className="flex justify-center mt-4 text-amber-400">
              {[...Array(5)].map((_, i) => <Star key={i} size={18} fill={i < lead.rating ? "currentColor" : "none"} />)}
            </div>

            <div className="mt-8 space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg flex items-center gap-3 text-left border border-gray-100">
                <div className="p-2 bg-white rounded-md shadow-sm text-emerald-600"><Phone size={16}/></div>
                <div><p className="text-[10px] text-slate-400 font-bold uppercase">Móvil</p><p className="text-sm font-medium">{lead.phone}</p></div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg flex items-center gap-3 text-left border border-gray-100">
                <div className="p-2 bg-white rounded-md shadow-sm text-emerald-600"><Mail size={16}/></div>
                <div><p className="text-[10px] text-slate-400 font-bold uppercase">Email</p><p className="text-sm font-medium truncate w-40">{lead.email}</p></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-4 text-sm uppercase">Actualizar Proceso</h4>
            <div className="grid grid-cols-2 gap-2">
              {(['Prospecto', 'Visitando', 'Interés', 'Cierre'] as PipelineStage[]).map(stage => (
                <button 
                  key={stage}
                  onClick={() => onUpdateStage(stage)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    lead.stage === stage ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-100' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tablero de Actividad/Docs */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="flex border-b border-gray-100">
              <button 
                onClick={() => setActiveSubTab('timeline')}
                className={`px-8 py-4 text-sm font-bold uppercase tracking-widest transition-all ${activeSubTab === 'timeline' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/30' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Historial / Tareas
              </button>
              <button 
                onClick={() => setActiveSubTab('docs')}
                className={`px-8 py-4 text-sm font-bold uppercase tracking-widest transition-all ${activeSubTab === 'docs' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/30' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Documentación
              </button>
            </div>

            <div className="p-6 flex-1">
              {activeSubTab === 'timeline' ? (
                <div className="space-y-6">
                  <AddEventForm onAdd={(type, description) => onAddEvent({ leadId: lead.id, type, description, date: new Date().toISOString(), completed: false })} />
                  
                  <div className="relative border-l-2 border-slate-100 ml-3 pl-8 space-y-8">
                    {events.length === 0 && <p className="text-slate-400 italic text-sm">Sin actividad registrada aún...</p>}
                    {events.map((event, idx) => (
                      <div key={event.id} className="relative">
                        <div className="absolute -left-[41px] top-0 w-5 h-5 bg-white border-2 border-emerald-500 rounded-full z-10"></div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 group hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded uppercase tracking-tighter">{event.type}</span>
                            <span className="text-[10px] text-slate-400 font-bold">{new Date(event.date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed">{event.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {AVAILABLE_DOCS.map(doc => (
                    <div key={doc.id} className="p-4 border border-gray-100 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-50 text-rose-500 rounded-lg group-hover:scale-110 transition-transform"><FileText size={20}/></div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">{doc.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{doc.category}</p>
                        </div>
                      </div>
                      <button className="text-slate-400 hover:text-emerald-600"><Download size={18}/></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PipelineView({ leads, onDragLead, onSelectLead }: { leads: Lead[], onDragLead: any, onSelectLead: any }) {
  const stages: PipelineStage[] = ['Prospecto', 'Visitando', 'Interés', 'Cierre'];
  
  return (
    <div className="flex gap-6 h-full overflow-x-auto pb-4">
      {stages.map(stage => (
        <div key={stage} className="min-w-[320px] bg-slate-100/50 rounded-2xl flex flex-col border border-slate-200/50">
          <div className="p-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${stage === 'Cierre' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
              {stage}
            </h3>
            <span className="bg-white px-2 py-1 rounded text-xs font-bold text-slate-400 shadow-sm border border-gray-100">
              {leads.filter(l => l.stage === stage).length}
            </span>
          </div>
          <div className="flex-1 p-3 space-y-3 overflow-y-auto">
            {leads.filter(l => l.stage === stage).map(lead => (
              <div 
                key={lead.id} 
                onClick={() => onSelectLead(lead.id)}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-emerald-300 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex text-amber-400">
                    {[...Array(lead.rating)].map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
                  </div>
                  <MoreVertical size={14} className="text-slate-300 group-hover:text-slate-600" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">{lead.firstName} {lead.lastName}</h4>
                <p className="text-[10px] text-slate-400 font-medium mt-1 truncate">{lead.email}</p>
                
                <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{lead.source}</span>
                  <div className="flex -space-x-1">
                    <div className="w-5 h-5 bg-slate-100 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500">
                      MP
                    </div>
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
  const sections: PropertyType[] = ['OLIVO', 'ARCE', 'PARCELA'];
  
  return (
    <div className="space-y-8">
      {sections.map(section => (
        <div key={section} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6 border-b border-gray-50 pb-4">
            <h3 className="text-lg font-black text-slate-800 tracking-tight">MODELO {section}</h3>
            <div className="flex gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-emerald-600"><span className="w-3 h-3 bg-emerald-500 rounded-sm"></span> LIBRE</span>
              <span className="flex items-center gap-1.5 text-amber-600"><span className="w-3 h-3 bg-amber-500 rounded-sm"></span> RESERVADO</span>
              <span className="flex items-center gap-1.5 text-slate-400"><span className="w-3 h-3 bg-slate-300 rounded-sm"></span> VENDIDO</span>
            </div>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-3">
            {inventory.filter(u => u.type === section).map(unit => (
              <div 
                key={unit.id}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center font-bold text-xs shadow-sm transition-all border-2 ${
                  unit.status === 'available' ? 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:scale-105 hover:bg-emerald-100' :
                  unit.status === 'reserved' ? 'bg-amber-50 border-amber-100 text-amber-700' : 
                  'bg-slate-50 border-slate-100 text-slate-300'
                }`}
              >
                {unit.number}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- FORMULARIOS ---

function AddLeadForm({ onSubmit, onCancel }: { onSubmit: any, onCancel: any }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    source: 'Web' as LeadSource,
    rating: 3,
    stage: 'Prospecto' as PipelineStage
  });

  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nombre</label><input required className="w-full p-2 bg-slate-50 border border-gray-200 rounded-lg text-sm" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} /></div>
        <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Apellidos</label><input required className="w-full p-2 bg-slate-50 border border-gray-200 rounded-lg text-sm" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} /></div>
      </div>
      <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email</label><input type="email" required className="w-full p-2 bg-slate-50 border border-gray-200 rounded-lg text-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
      <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Teléfono</label><input required className="w-full p-2 bg-slate-50 border border-gray-200 rounded-lg text-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Origen</label>
          <select className="w-full p-2 bg-slate-50 border border-gray-200 rounded-lg text-sm" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value as LeadSource})}>
            {['Web', 'RRSS', 'Idealista', 'Buzoneo', 'Referido', 'Otros'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Valoración</label>
          <select className="w-full p-2 bg-slate-50 border border-gray-200 rounded-lg text-sm" value={formData.rating} onChange={e => setFormData({...formData, rating: Number(e.target.value)})}>
            {[1,2,3,4,5].map(v => <option key={v} value={v}>{v} Estrellas</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-6">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 text-sm font-bold text-slate-400 bg-white hover:bg-slate-50 rounded-lg transition-colors border border-gray-200 uppercase tracking-tighter">Cancelar</button>
        <button type="submit" className="flex-1 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-lg shadow-emerald-200 uppercase tracking-tighter">Guardar Cliente</button>
      </div>
    </form>
  );
}

function AddEventForm({ onAdd }: { onAdd: (type: EventType, desc: string) => void }) {
  const [desc, setDesc] = useState('');
  const [type, setType] = useState<EventType>('Llamada');

  return (
    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex gap-3 items-end group">
      <div className="flex-1 space-y-2">
        <label className="block text-[9px] font-black text-emerald-700 uppercase tracking-widest ml-1">Registrar nueva actividad</label>
        <div className="flex gap-2">
          <select 
            value={type} 
            onChange={e => setType(e.target.value as EventType)}
            className="text-xs font-bold border-none bg-white rounded-lg px-2 py-2 shadow-sm focus:ring-2 focus:ring-emerald-500/20"
          >
            {['Contacto', 'Llamada', 'Cita Oficina', 'Cita Obra', 'Reserva', 'Otros'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input 
            className="flex-1 p-2 text-sm bg-white border-none rounded-lg shadow-sm placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20" 
            placeholder="¿Qué ha ocurrido con este cliente?"
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
        </div>
      </div>
      <button 
        onClick={() => { if(desc) { onAdd(type, desc); setDesc(''); } }}
        className="p-2 bg-emerald-600 text-white rounded-lg shadow-md hover:bg-emerald-700 transition-all hover:scale-110"
      >
        <Send size={18} />
      </button>
    </div>
  );
}