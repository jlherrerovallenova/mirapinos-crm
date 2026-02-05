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
  Edit2
} from 'lucide-react';

/**
 * TIPOS DE DATOS (Coincidentes con SQL)
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
  rating: number; // 1-5
  createdAt: string;
}

interface Event {
  id: string;
  leadId: string;
  type: EventType;
  date: string; // ISO String
  description: string;
  completed: boolean;
}

interface Document {
  id: string;
  name: string;
  category: string;
  url: string;
}

interface InventoryUnit {
  id: number;
  number: string;
  type: PropertyType;
  status: 'available' | 'reserved' | 'sold';
  leadId?: string; // Si está reservado, quién lo reservó
}

/**
 * DATOS DE EJEMPLO (MOCK DATA)
 */
const INITIAL_LEADS: Lead[] = [
  { id: '1', firstName: 'Carlos', lastName: 'Ruiz', phone: '600123456', email: 'carlos@email.com', source: 'Idealista', stage: 'Prospecto', rating: 3, createdAt: '2023-10-01' },
  { id: '2', firstName: 'Ana', lastName: 'García', phone: '611223344', email: 'ana.garcia@email.com', source: 'Web', stage: 'Visitando', rating: 4, createdAt: '2023-10-05' },
  { id: '3', firstName: 'Pedro', lastName: 'Martínez', phone: '622334455', email: 'pedro@email.com', source: 'Referido', stage: 'Interés', rating: 5, createdAt: '2023-10-10' },
  { id: '4', firstName: 'Lucía', lastName: 'Fernández', phone: '633445566', email: 'lucia@email.com', source: 'RRSS', stage: 'Cierre', rating: 5, createdAt: '2023-09-20' },
];

const INITIAL_EVENTS: Event[] = [
  { id: '101', leadId: '2', type: 'Cita Obra', date: '2023-10-28T10:00:00', description: 'Visita piloto Olivo', completed: true },
  { id: '102', leadId: '3', type: 'Llamada', date: '2023-10-29T16:30:00', description: 'Confirmar financiación', completed: false },
];

const AVAILABLE_DOCS: Document[] = [
  { id: 'd1', name: 'Plano General Mirapinos', category: 'General', url: '#' },
  { id: 'd2', name: 'Memoria de Calidades Olivo', category: 'Olivo', url: '#' },
  { id: 'd3', name: 'Plano Planta Baja Arce', category: 'Arce', url: '#' },
  { id: 'd4', name: 'Plano Planta Alta Arce', category: 'Arce', url: '#' },
  { id: 'd5', name: 'Forma de Pago Estándar', category: 'Financiero', url: '#' },
];

// Generar inventario basado en la descripción
const generateInventory = (): InventoryUnit[] => {
  const units: InventoryUnit[] = [];
  // Olivo 1-13
  for (let i = 1; i <= 13; i++) units.push({ id: i, number: `${i}`, type: 'OLIVO', status: i === 2 ? 'reserved' : 'available' });
  // Arce 14-35
  for (let i = 14; i <= 35; i++) units.push({ id: i, number: `${i}`, type: 'ARCE', status: i === 20 ? 'sold' : 'available' });
  // Parcelas 11
  for (let i = 1; i <= 11; i++) units.push({ id: 100+i, number: `P-${i}`, type: 'PARCELA', status: 'available' });
  return units;
};

/**
 * COMPONENTE PRINCIPAL
 */
export default function MirapinosCRM() {
  // ESTADOS GLOBALES
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'pipeline' | 'inventory'>('dashboard');
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);
  const [inventory, setInventory] = useState<InventoryUnit[]>(generateInventory());
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  
  // ESTADOS DE UI (Modales, Filtros)
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState<PipelineStage | 'All'>('All');
  const [filterRating, setFilterRating] = useState<number | 0>(0); // 0 es todos

  // DATOS COMPUTADOS
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = (lead.firstName + ' ' + lead.lastName + lead.email + lead.phone).toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStage = filterStage === 'All' || lead.stage === filterStage;
      const matchesRating = filterRating === 0 || lead.rating >= filterRating;
      return matchesSearch && matchesStage && matchesRating;
    });
  }, [leads, searchTerm, filterStage, filterRating]);

  // FUNCIONES DE ACCIÓN
  const addLead = (newLead: Omit<Lead, 'id' | 'createdAt'>) => {
    const lead: Lead = {
      ...newLead,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    setLeads([...leads, lead]);
    setIsAddLeadOpen(false);
  };

  const updateLeadStage = (leadId: string, newStage: PipelineStage) => {
    setLeads(leads.map(l => l.id === leadId ? { ...l, stage: newStage } : l));
  };

  const addEvent = (newEvent: Omit<Event, 'id'>) => {
    const event: Event = {
      ...newEvent,
      id: Math.random().toString(36).substr(2, 9)
    };
    setEvents([...events, event]);
  };

  // RENDERIZADO
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
          <button className="flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-colors">
            <Settings size={18} /> Configuración
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-xl font-semibold text-slate-700">
            {activeTab === 'dashboard' && 'Panel Principal'}
            {activeTab === 'leads' && 'Gestión de Clientes'}
            {activeTab === 'pipeline' && 'Túnel de Ventas'}
            {activeTab === 'inventory' && 'Inventario de Promoción'}
          </h2>
          
          <div className="flex items-center gap-4">
             <button 
                onClick={() => setIsAddLeadOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm">
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
              <button onClick={() => setIsAddLeadOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <AddLeadForm onSubmit={addLead} onCancel={() => setIsAddLeadOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * SUB-COMPONENTES
 */

// --- DASHBOARD ---
function DashboardView({ leads, inventory, events }: { leads: Lead[], inventory: InventoryUnit[], events: Event[] }) {
  const sold = inventory.filter(i => i.status === 'sold').length;
  const reserved = inventory.filter(i => i.status === 'reserved').length;
  const available = inventory.length - sold - reserved;
  const pendingEvents = events.filter(e => !e.completed).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Viviendas Disponibles" value={available} total={inventory.length} color="text-emerald-600" />
      <StatCard title="Reservas Activas" value={reserved} subtext="En proceso de firma" color="text-amber-500" />
      <StatCard title="Ventas Cerradas" value={sold} subtext="Contratos firmados" color="text-blue-600" />
      <StatCard title="Agenda Pendiente" value={pendingEvents} subtext="Eventos para hoy" color="text-rose-500" />
      
      {/* Gráfico simple de Pipeline */}
      <div className="col-span-1 lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-slate-700">Estado del Embudo</h3>
        <div className="space-y-4">
          {['Prospecto', 'Visitando', 'Interés', 'Cierre'].map((stage) => {
            const count = leads.filter(l => l.stage === stage).length;
            const pct = (count / leads.length) * 100 || 0;
            return (
              <div key={stage}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-600">{stage}</span>
                  <span className="text-slate-400">{count} clientes</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-800 rounded-full" style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

       <div className="col-span-1 lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-slate-700">Resumen de Tipologías</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
             <div className="p-4 bg-emerald-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-800">13</div>
                <div className="text-sm text-emerald-600 font-medium">Olivo (Adosadas)</div>
             </div>
             <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-800">22</div>
                <div className="text-sm text-blue-600 font-medium">Arce (Pareadas)</div>
             </div>
             <div className="p-4 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-800">11</div>
                <div className="text-sm text-amber-600 font-medium">Parcelas</div>
             </div>
          </div>
       </div>
    </div>
  );
}

// --- LISTA DE CLIENTES ---
function LeadsListView({ leads, onSelectLead, searchTerm, setSearchTerm, filterStage, setFilterStage, filterRating, setFilterRating }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
      {/* Filters Toolbar */}
      <div className="p-4 border-b border-gray-100 flex gap-4 flex-wrap bg-gray-50 rounded-t-xl">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, email o teléfono..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm"
          value={filterStage}
          onChange={(e) => setFilterStage(e.target.value)}
        >
          <option value="All">Todas las etapas</option>
          <option value="Prospecto">Prospecto</option>
          <option value="Visitando">Visitando</option>
          <option value="Interés">Interés</option>
          <option value="Cierre">Cierre</option>
        </select>

        <select 
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm"
          value={filterRating}
          onChange={(e) => setFilterRating(Number(e.target.value))}
        >
          <option value={0}>Cualificación (Todas)</option>
          <option value={1}>1+ Estrellas</option>
          <option value={3}>3+ Estrellas</option>
          <option value={5}>5 Estrellas</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-auto flex-1">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-medium sticky top-0">
            <tr>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Contacto</th>
              <th className="px-6 py-4">Origen</th>
              <th className="px-6 py-4">Etapa</th>
              <th className="px-6 py-4">Cualificación</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leads.map((lead: Lead) => (
              <tr key={lead.id} className="hover:bg-emerald-50/30 transition-colors group cursor-pointer" onClick={() => onSelectLead(lead.id)}>
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-800">{lead.firstName} {lead.lastName}</div>
                  <div className="text-xs text-gray-400">Creado: {new Date(lead.createdAt).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  <div className="flex items-center gap-2"><Phone size={14}/> {lead.phone}</div>
                  <div className="flex items-center gap-2 mt-1"><Mail size={14}/> {lead.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs border border-gray-200">{lead.source}</span>
                </td>
                <td className="px-6 py-4">
                   <StageBadge stage={lead.stage} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < lead.rating ? "currentColor" : "none"} className={i < lead.rating ? "" : "text-gray-300"} />
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-emerald-600 font-medium hover:text-emerald-800 opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver Ficha
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            No se encontraron clientes con estos filtros.
          </div>
        )}
      </div>
    </div>
  );
}

// --- DETALLE DE CLIENTE ---
function LeadDetailView({ lead, onBack, events, onAddEvent, onUpdateStage }: { lead: Lead, onBack: () => void, events: Event[], onAddEvent: any, onUpdateStage: (s: PipelineStage) => void }) {
  const [activeTab, setActiveTab] = useState<'agenda' | 'docs'>('agenda');
  const [showDocModal, setShowDocModal] = useState(false);
  
  // Doc selection state
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  const handleSendDocs = () => {
    if (selectedDocs.length === 0) return;
    const docNames = AVAILABLE_DOCS.filter(d => selectedDocs.includes(d.id)).map(d => d.name).join(', ');
    
    // Add event to agenda
    onAddEvent({
      leadId: lead.id,
      type: 'Envio Documentacion',
      date: new Date().toISOString(),
      description: `Documentos enviados: ${docNames}`,
      completed: true
    });
    
    setShowDocModal(false);
    setSelectedDocs([]);
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header Ficha */}
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ChevronRight className="rotate-180 text-gray-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{lead.firstName} {lead.lastName}</h2>
            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
              <span className="flex items-center gap-1"><Phone size={14}/> {lead.phone}</span>
              <span className="flex items-center gap-1"><Mail size={14}/> {lead.email}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex flex-col items-end mr-4">
              <span className="text-xs text-gray-500 mb-1">Cualificación</span>
              <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill={i < lead.rating ? "currentColor" : "none"} className={i < lead.rating ? "" : "text-gray-300"} />
                  ))}
              </div>
           </div>
           <select 
              value={lead.stage}
              onChange={(e) => onUpdateStage(e.target.value as PipelineStage)}
              className="bg-white border border-gray-300 text-slate-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2.5"
            >
              <option value="Prospecto">Prospecto</option>
              <option value="Visitando">Visitando</option>
              <option value="Interés">Interés</option>
              <option value="Cierre">Cierre</option>
            </select>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Info Column */}
        <div className="w-1/3 border-r border-gray-100 p-6 overflow-auto">
          <h3 className="font-semibold text-gray-700 mb-4 uppercase text-xs tracking-wider">Datos del Cliente</h3>
          <div className="space-y-4">
            <InfoRow label="Origen" value={lead.source} />
            <InfoRow label="Fecha Alta" value={new Date(lead.createdAt).toLocaleDateString()} />
            <InfoRow label="Interés Principal" value="Adosado Olivo (Est.)" />
            <div className="pt-4 border-t border-gray-100">
               <label className="text-xs text-gray-500 block mb-1">Notas</label>
               <textarea className="w-full text-sm border-gray-200 rounded-lg bg-gray-50 p-3 h-32" placeholder="Escribe notas sobre el cliente..."></textarea>
            </div>
          </div>
        </div>

        {/* Activity Column */}
        <div className="flex-1 flex flex-col bg-slate-50">
          <div className="flex border-b border-gray-200 bg-white px-6">
            <button 
              className={`py-4 mr-6 text-sm font-medium border-b-2 ${activeTab === 'agenda' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500'}`}
              onClick={() => setActiveTab('agenda')}
            >
              Agenda y Actividad
            </button>
            <button 
               className={`py-4 mr-6 text-sm font-medium border-b-2 ${activeTab === 'docs' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500'}`}
               onClick={() => setActiveTab('docs')}
            >
              Documentación Enviada
            </button>
          </div>

          <div className="flex-1 p-6 overflow-auto">
             {activeTab === 'agenda' && (
                <div className="space-y-6">
                   <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-slate-700">Historial de Eventos</h4>
                      <div className="flex gap-2">
                        <button className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50">+ Llamada</button>
                        <button className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50">+ Cita</button>
                      </div>
                   </div>
                   
                   {/* Timeline */}
                   <div className="relative border-l-2 border-gray-200 ml-3 space-y-8">
                      {events.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(event => (
                        <div key={event.id} className="relative pl-8">
                           <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white ${event.type === 'Envio Documentacion' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                           <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                              <div className="flex justify-between items-start mb-1">
                                 <span className="font-semibold text-sm text-slate-800">{event.type}</span>
                                 <span className="text-xs text-gray-400">{new Date(event.date).toLocaleString()}</span>
                              </div>
                              <p className="text-sm text-gray-600">{event.description}</p>
                           </div>
                        </div>
                      ))}
                      {events.length === 0 && <p className="pl-8 text-gray-400 italic text-sm">No hay eventos registrados.</p>}
                   </div>
                </div>
             )}

             {activeTab === 'docs' && (
                <div>
                   <div className="flex justify-between items-center mb-6">
                      <p className="text-sm text-gray-600">Documentos enviados previamente a este cliente.</p>
                      <button 
                        onClick={() => setShowDocModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700 transition"
                      >
                         <Send size={16} /> Enviar Documentación
                      </button>
                   </div>
                   
                   {/* Lista filtrada de eventos tipo doc */}
                   <div className="space-y-3">
                      {events.filter(e => e.type === 'Envio Documentacion').map(e => (
                         <div key={e.id} className="flex items-start gap-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                            <div className="bg-blue-100 p-2 rounded text-blue-600">
                               <FileText size={20} />
                            </div>
                            <div>
                               <p className="text-sm font-medium text-slate-800">Envío realizado</p>
                               <p className="text-xs text-blue-600 mb-1">{new Date(e.date).toLocaleString()}</p>
                               <p className="text-sm text-gray-600">{e.description}</p>
                            </div>
                         </div>
                      ))}
                      {events.filter(e => e.type === 'Envio Documentacion').length === 0 && (
                         <div className="text-center py-10 bg-white rounded border border-dashed border-gray-300">
                            <FileText className="mx-auto text-gray-300 mb-2" size={32} />
                            <p className="text-gray-400 text-sm">Aún no se ha enviado documentación</p>
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
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
              <h3 className="text-lg font-bold mb-4">Seleccionar Documentación para enviar</h3>
              <div className="grid grid-cols-2 gap-3 mb-6 max-h-[400px] overflow-auto">
                 {AVAILABLE_DOCS.map(doc => (
                    <label key={doc.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedDocs.includes(doc.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                       <input 
                          type="checkbox" 
                          className="w-4 h-4 text-blue-600 rounded"
                          checked={selectedDocs.includes(doc.id)}
                          onChange={(e) => {
                             if(e.target.checked) setSelectedDocs([...selectedDocs, doc.id]);
                             else setSelectedDocs(selectedDocs.filter(id => id !== doc.id));
                          }}
                       />
                       <div>
                          <div className="text-sm font-medium text-slate-800">{doc.name}</div>
                          <div className="text-xs text-gray-500 uppercase">{doc.category}</div>
                       </div>
                    </label>
                 ))}
              </div>
              <div className="flex justify-end gap-3">
                 <button onClick={() => setShowDocModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancelar</button>
                 <button 
                    onClick={handleSendDocs}
                    disabled={selectedDocs.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                 >
                    <Send size={16} /> Enviar Selección ({selectedDocs.length})
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

// --- PIPELINE KANBAN ---
function PipelineView({ leads, onDragLead, onSelectLead }: any) {
  const stages: PipelineStage[] = ['Prospecto', 'Visitando', 'Interés', 'Cierre'];

  return (
    <div className="flex h-full gap-4 overflow-x-auto pb-4">
      {stages.map(stage => (
        <div key={stage} className="flex-1 min-w-[280px] bg-gray-100 rounded-xl flex flex-col max-h-full">
           <div className="p-3 border-b border-gray-200 font-semibold text-slate-700 flex justify-between">
              {stage}
              <span className="bg-white px-2 py-0.5 rounded text-xs text-gray-500 border border-gray-200">
                 {leads.filter((l: Lead) => l.stage === stage).length}
              </span>
           </div>
           <div className="p-3 flex-1 overflow-auto space-y-3">
              {leads.filter((l: Lead) => l.stage === stage).map((lead: Lead) => (
                 <div key={lead.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md cursor-pointer transition-shadow group relative" onClick={() => onSelectLead(lead.id)}>
                    <div className="font-medium text-slate-800 mb-1">{lead.firstName} {lead.lastName}</div>
                    <div className="text-xs text-gray-500 mb-3">{lead.source}</div>
                    
                    <div className="flex justify-between items-center">
                       <div className="flex text-amber-400">
                          <Star size={12} fill={lead.rating >= 1 ? "currentColor" : "none"} />
                          <span className="text-xs text-gray-400 ml-1 font-medium">{lead.rating}/5</span>
                       </div>
                       
                       {/* Botones simples para mover (simula Drag&Drop) */}
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          {stage !== 'Prospecto' && <button onClick={() => onDragLead(lead.id, stages[stages.indexOf(stage)-1])} className="p-1 hover:bg-gray-100 rounded text-gray-500" title="Mover atrás"><ChevronRight size={14} className="rotate-180"/></button>}
                          {stage !== 'Cierre' && <button onClick={() => onDragLead(lead.id, stages[stages.indexOf(stage)+1])} className="p-1 hover:bg-emerald-50 rounded text-emerald-600" title="Avanzar"><ChevronRight size={14} /></button>}
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

// --- INVENTARIO VISUAL ---
function InventoryView({ inventory }: { inventory: InventoryUnit[] }) {
  const olivo = inventory.filter(i => i.type === 'OLIVO');
  const arce = inventory.filter(i => i.type === 'ARCE');
  const parcelas = inventory.filter(i => i.type === 'PARCELA');

  const UnitCard = ({ unit }: { unit: InventoryUnit }) => {
    const statusColors = {
      available: 'bg-white border-emerald-200 hover:border-emerald-400',
      reserved: 'bg-amber-50 border-amber-200',
      sold: 'bg-blue-50 border-blue-200 opacity-75'
    };
    const statusDot = {
      available: 'bg-emerald-500',
      reserved: 'bg-amber-500',
      sold: 'bg-blue-500'
    };

    return (
      <div className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center relative shadow-sm transition-all cursor-pointer ${statusColors[unit.status]}`}>
        <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${statusDot[unit.status]}`} title={unit.status}></div>
        <span className="text-xs font-bold text-gray-400 uppercase mb-1">{unit.type}</span>
        <span className="text-2xl font-bold text-slate-700">{unit.number}</span>
        <span className="text-[10px] uppercase tracking-wider text-gray-500 mt-2 font-medium">
           {unit.status === 'available' ? 'Disponible' : unit.status === 'reserved' ? 'Reservado' : 'Vendido'}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-10 pb-10">
      <div className="flex gap-6 mb-8">
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div><span className="text-sm">Disponible</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500 rounded-full"></div><span className="text-sm">Reservado</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full"></div><span className="text-sm">Vendido</span></div>
      </div>

      <section>
        <h3 className="text-lg font-bold text-emerald-800 border-b border-emerald-100 pb-2 mb-4">Tipología OLIVO (Adosadas) - Unidades 1 a 13</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {olivo.map(u => <UnitCard key={u.id} unit={u} />)}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-blue-800 border-b border-blue-100 pb-2 mb-4">Tipología ARCE (Pareadas) - Unidades 14 a 35</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {arce.map(u => <UnitCard key={u.id} unit={u} />)}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-amber-800 border-b border-amber-100 pb-2 mb-4">Parcelas Autopromoción</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {parcelas.map(u => <UnitCard key={u.id} unit={u} />)}
        </div>
      </section>
    </div>
  );
}

// --- FORMULARIO ALTA CLIENTE ---
function AddLeadForm({ onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    source: 'Web' as LeadSource,
    stage: 'Prospecto' as PipelineStage,
    rating: 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
           <input required type="text" className="w-full border border-gray-300 rounded-lg p-2 text-sm" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
        </div>
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
           <input required type="text" className="w-full border border-gray-300 rounded-lg p-2 text-sm" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
           <input required type="tel" className="w-full border border-gray-300 rounded-lg p-2 text-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
        </div>
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
           <input required type="email" className="w-full border border-gray-300 rounded-lg p-2 text-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
        </div>
      </div>

      <div>
         <label className="block text-sm font-medium text-gray-700 mb-1">Origen del contacto</label>
         <select className="w-full border border-gray-300 rounded-lg p-2 text-sm" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value as LeadSource})}>
            <option value="Web">Web</option>
            <option value="RRSS">Redes Sociales</option>
            <option value="Idealista">Idealista</option>
            <option value="Buzoneo">Buzoneo</option>
            <option value="Referido">Referido</option>
            <option value="Otros">Otros</option>
         </select>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
         <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancelar</button>
         <button type="submit" className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-sm font-medium">Guardar Cliente</button>
      </div>
    </form>
  );
}

// --- UI HELPERS ---
function SidebarItem({ icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
    >
      {icon}
      {label}
    </button>
  );
}

function StageBadge({ stage }: { stage: PipelineStage }) {
   const colors = {
      'Prospecto': 'bg-gray-100 text-gray-600',
      'Visitando': 'bg-blue-100 text-blue-700',
      'Interés': 'bg-amber-100 text-amber-700',
      'Cierre': 'bg-emerald-100 text-emerald-700'
   };
   return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[stage]}`}>
         {stage}
      </span>
   );
}

function StatCard({ title, value, subtext, total, color }: any) {
   return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
         <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold">{title}</p>
         <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${color}`}>{value}</span>
            {total && <span className="text-sm text-gray-400">/ {total}</span>}
         </div>
         {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
   );
}

function InfoRow({ label, value }: { label: string, value: string }) {
   return (
      <div className="flex flex-col border-b border-gray-100 last:border-0 py-2">
         <span className="text-xs text-gray-400">{label}</span>
         <span className="text-sm font-medium text-slate-700">{value}</span>
      </div>
   );
}