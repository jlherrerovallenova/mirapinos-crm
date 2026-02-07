// src/pages/Leads.tsx
import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Calendar,
  User,
  X,
  Edit2,
  Trash2
} from 'lucide-react';
import { StageBadge, AppNotification } from '../components/Shared';

const LEADS = [
  {
    id: '1',
    name: 'Roberto Jiménez',
    email: 'roberto.j@email.com',
    phone: '+34 612 345 678',
    stage: 'Prospecto',
    source: 'Web Directa',
    date: '2024-03-15',
    lastContact: 'Hace 2 días'
  },
  {
    id: '2',
    name: 'Elena Martínez',
    email: 'elena.mtz@email.com',
    phone: '+34 699 888 777',
    stage: 'Visitando',
    source: 'Recomendación',
    date: '2024-03-12',
    lastContact: 'Ayer'
  },
  {
    id: '3',
    name: 'Ignacio Silva',
    email: 'isilva@proyectos.es',
    phone: '+34 600 111 222',
    stage: 'Cierre',
    source: 'Instagram',
    date: '2024-03-10',
    lastContact: 'Hace 1 hora'
  }
];

export function Leads() {
  const [selectedLead, setSelectedLead] = useState<any>(null);
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

  const handleDelete = (name: string) => {
    // Aquí iría la lógica de borrado con Supabase
    setSelectedLead(null);
    setNotification({
      show: true,
      title: "CLIENTE ELIMINADO",
      message: `El registro de ${name} ha sido borrado correctamente.`,
      type: 'error'
    });
  };

  const handleEdit = (name: string) => {
    // Aquí iría la lógica para abrir el formulario de edición
    setNotification({
      show: true,
      title: "MODO EDICIÓN",
      message: `Cargando formulario para editar a ${name}...`,
      type: 'info'
    });
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-poppins font-bold text-pine-900 tracking-tighter mb-2">
            Gestión de Leads
          </h1>
          <p className="text-slate-500 font-medium">Control centralizado de prospectos y clientes</p>
        </div>
        <button className="bg-pine-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-pine-800 transition-all shadow-lg shadow-pine-900/20 active:scale-95 group">
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          NUEVO PROSPECTO
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-pine-100 mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-pine-200 focus:ring-0 transition-all text-slate-600 font-medium"
          />
        </div>
        <div className="flex gap-2">
          <button className="px-6 py-3 rounded-xl bg-white border border-pine-100 text-slate-600 font-bold flex items-center gap-2 hover:bg-pine-50 transition-all">
            <Filter size={18} />
            FILTRAR
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-4xl shadow-sm border border-pine-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-bottom border-pine-50">
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Prospecto</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Estado</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Origen</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Último Contacto</th>
              <th className="px-8 py-5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pine-50">
            {LEADS.map((lead) => (
              <tr 
                key={lead.id} 
                className="hover:bg-pine-50/30 transition-colors cursor-pointer group"
                onClick={() => setSelectedLead(lead)}
              >
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pine-100 to-pine-50 flex items-center justify-center text-pine-600 font-bold text-lg shadow-sm group-hover:scale-110 transition-transform">
                      {lead.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{lead.name}</p>
                      <p className="text-xs text-slate-400 font-medium">{lead.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <StageBadge stage={lead.stage} />
                </td>
                <td className="px-8 py-6">
                  <span className="text-sm font-bold text-slate-600">{lead.source}</span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar size={14} />
                    <span className="text-xs font-bold uppercase tracking-tighter">{lead.lastContact}</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <button className="p-2 hover:bg-white rounded-xl transition-all text-slate-300 hover:text-pine-600 shadow-sm opacity-0 group-hover:opacity-100">
                    <MoreHorizontal size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div 
            className="absolute inset-0 bg-pine-900/40 backdrop-blur-md"
            onClick={() => setSelectedLead(null)}
          ></div>
          
          <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
            {/* Modal Header con botones de acción */}
            <div className="bg-gradient-to-r from-pine-900 to-pine-800 p-10 text-white relative">
              <div className="flex justify-between items-start mb-6">
                <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl flex items-center justify-center text-3xl font-bold border border-white/10">
                  {selectedLead.name.charAt(0)}
                </div>
                <div className="flex gap-2">
                  {/* BOTÓN EDITAR */}
                  <button 
                    onClick={() => handleEdit(selectedLead.name)}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/10 group"
                    title="Editar Cliente"
                  >
                    <Edit2 size={20} className="group-hover:scale-110 transition-transform" />
                  </button>
                  
                  {/* BOTÓN BORRAR */}
                  <button 
                    onClick={() => handleDelete(selectedLead.name)}
                    className="p-3 bg-rose-500/20 hover:bg-rose-500/40 rounded-2xl transition-all border border-rose-500/20 group"
                    title="Eliminar Cliente"
                  >
                    <Trash2 size={20} className="text-rose-200 group-hover:scale-110 transition-transform" />
                  </button>

                  <button 
                    onClick={() => setSelectedLead(null)}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/10"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              <h2 className="text-4xl font-poppins font-bold tracking-tighter mb-2">{selectedLead.name}</h2>
              <div className="flex gap-4 items-center opacity-80">
                <StageBadge stage={selectedLead.stage} />
                <span className="text-sm font-medium tracking-wide uppercase">{selectedLead.source}</span>
              </div>
            </div>

            <div className="p-10 grid grid-cols-2 gap-8 bg-slate-50/50">
              <div className="space-y-6">
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-pine-50 flex items-center justify-center text-pine-600 group-hover:bg-pine-600 group-hover:text-white transition-all">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                    <p className="font-bold text-slate-700">{selectedLead.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-pine-50 flex items-center justify-center text-pine-600 group-hover:bg-pine-600 group-hover:text-white transition-all">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono</p>
                    <p className="font-bold text-slate-700">{selectedLead.phone}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-pine-50 flex items-center justify-center text-pine-600 group-hover:bg-pine-600 group-hover:text-white transition-all">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha de Registro</p>
                    <p className="font-bold text-slate-700">{selectedLead.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-pine-50 flex items-center justify-center text-pine-600 group-hover:bg-pine-600 group-hover:text-white transition-all">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asignado a</p>
                    <p className="font-bold text-slate-700">Agente Principal</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-10 bg-white border-t border-pine-50">
              <button className="w-full bg-pine-50 text-pine-600 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-pine-600 hover:text-white transition-all">
                Ver Historial Completo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificación de acciones */}
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