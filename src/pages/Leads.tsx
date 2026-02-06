// src/pages/Leads.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StageBadge } from '../components/Shared';
import { Search, Filter, Plus, MoreHorizontal, Eye } from 'lucide-react';

export default function Leads() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  const initialLeads = [
    { id: 1, name: 'Juan Pérez', email: 'juan@email.com', stage: 'Prospecto', date: '2024-03-20' },
    { id: 2, name: 'María García', email: 'maria@email.com', stage: 'Visitando', date: '2024-03-19' },
    { id: 3, name: 'Carlos López', email: 'carlos@email.com', stage: 'Interés', date: '2024-03-18' },
    { id: 4, name: 'Ana Martínez', email: 'ana@email.com', stage: 'Cierre', date: '2024-03-17' },
  ];

  const filteredLeads = initialLeads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in">
      <header className="flex justify-between items-center">
        <div>
          <p className="text-pine-600 font-bold uppercase tracking-[0.3em] text-[10px] mb-2">CRM Gestión</p>
          <h1 className="text-4xl font-poppins font-bold text-slate-900 tracking-tight">Clientes</h1>
        </div>
        <button className="px-8 py-4 bg-pine-600 text-white font-bold rounded-2xl shadow-lg shadow-pine-600/20 hover:bg-emerald-500 transition-all text-sm flex items-center gap-2">
          <Plus size={20} /> Crear Cliente
        </button>
      </header>

      <div className="bg-white rounded-4xl shadow-sm border border-pine-100 overflow-hidden">
        <div className="p-6 border-b border-pine-50 flex justify-between items-center bg-white">
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-2.5 text-slate-400" size={18} />
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-2.5 bg-pine-50 border-none rounded-xl text-sm w-80 outline-none focus:ring-2 focus:ring-pine-600/10" 
                placeholder="Buscar por nombre o correo..." 
              />
            </div>
            <button className="px-4 py-2.5 bg-white border border-pine-100 rounded-xl text-sm font-bold text-slate-600 flex items-center gap-2 hover:bg-pine-50 transition-all">
              <Filter size={18} /> Filtros
            </button>
          </div>
          <p className="text-xs font-bold text-slate-400">Mostrando {filteredLeads.length} clientes</p>
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-pine-50/50">
              <th className="px-8 py-5 text-left text-[10px] font-black text-pine-900/40 uppercase tracking-widest">Cliente</th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-pine-900/40 uppercase tracking-widest">Estado</th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-pine-900/40 uppercase tracking-widest">Última Actividad</th>
              <th className="px-8 py-5 text-right text-[10px] font-black text-pine-900/40 uppercase tracking-widest">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pine-50">
            {filteredLeads.map((lead) => (
              <tr 
                key={lead.id} 
                onClick={() => navigate(`/leads/${lead.id}`)}
                className="hover:bg-pine-50/30 transition-colors group cursor-pointer"
              >
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-pine-100 rounded-xl flex items-center justify-center text-pine-600 font-bold text-xs">
                      {lead.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{lead.name}</p>
                      <p className="text-xs text-slate-400">{lead.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <StageBadge stage={lead.stage} />
                </td>
                <td className="px-8 py-6 text-sm font-medium text-slate-500">
                  {lead.date}
                </td>
                <td className="px-8 py-6 text-right">
                  <button className="p-2 text-slate-300 hover:text-pine-600 transition-colors">
                    <Eye size={20} />
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