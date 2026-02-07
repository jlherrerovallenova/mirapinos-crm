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

  const handleDelete = (e: React.MouseEvent, name: string) => {
    e.stopPropagation(); // Evita conflictos con el cierre del modal
    setSelectedLead(null);
    setNotification({
      show: true,
      title: "CLIENTE ELIMINADO",
      message: `El registro de ${name} ha sido borrado correctamente.`,
      type: 'error'
    });
  };

  const handleEdit = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    setNotification({
      show: true,
      title: "MODO EDICIÓN",
      message: `Cargando formulario para editar a ${name}...`,
      type: 'info'
    });
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
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

      <div className="bg-white p-4 rounded-3xl shadow-sm border border-pine-100 mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-pine-200 focus:ring-0 transition-all text-slate-600 font-medium"
          />
        </div>
      </div>

      <div className="bg-white rounded-4xl shadow-sm border border-pine-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Prospecto</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Estado</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Origen</th>
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
                    <div className="w-12 h-12 rounded-2xl bg-pine-100 flex items-center justify-center text-pine-600 font-bold">
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
                <td className="px-8 py-6 text-right">
                  <MoreHorizontal size={20} className="text-slate-300 ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-pine-900/60 backdrop-blur-sm" onClick={() => setSelectedLead(null)}></div>
          
          <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Cabecera del Modal con Botones Visibles */}
            <div className="bg-pine-900 p-10 text-white flex justify-between items-start">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-bold mb-4">
                  {selectedLead.name.charAt(0)}
                </div>
                <h2 className="text-3xl font-poppins font-bold tracking-tighter">{selectedLead.name}</h2>
                <div className="mt-2">
                  <StageBadge stage={selectedLead.stage} />
                </div>
              </div>

              {/* GRUPO DE BOTONES: EDITAR, BORRAR, CERRAR */}
              <div className="flex gap-2">
                <button 
                  onClick={(e) => handleEdit(e, selectedLead.name)}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10 text-white"
                  title="Editar"
                >
                  <Edit2 size={20} />
                </button>
                <button 
                  onClick={(e) => handleDelete(e, selectedLead.name)}
                  className="p-3 bg-rose-500/20 hover:bg-rose-500 text-white rounded-xl transition-all border border-rose-500/20"
                  title="Borrar"
                >
                  <Trash2 size={20} />
                </button>
                <button 
                  onClick={() => setSelectedLead(null)}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-10 grid grid-cols-2 gap-8 bg-slate-50">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                  <p className="font-bold text-slate-700">{selectedLead.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono</p>
                  <p className="font-bold text-slate-700">{selectedLead.phone}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Registro</p>
                  <p className="font-bold text-slate-700">{selectedLead.date}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Origen</p>
                  <p className="font-bold text-slate-700">{selectedLead.source}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
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