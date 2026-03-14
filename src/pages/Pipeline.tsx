// src/pages/Pipeline.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2,
  Globe,
  Smartphone,
  Users,
  HelpCircle,
  MoreHorizontal
} from 'lucide-react';
import { useLeads, useUpdateLead } from '../hooks/useLeads';
import type { Database } from '../types/supabase';
import LeadDetailModal from '../components/leads/LeadDetailModal';

type Lead = Database['public']['Tables']['leads']['Row'];

const COLUMNS = [
  { id: 'new', title: 'Nuevos', color: 'border-blue-400', bg: 'bg-blue-50/50', text: 'text-blue-700' },
  { id: 'contacted', title: 'Contactados', color: 'border-purple-400', bg: 'bg-purple-50/50', text: 'text-purple-700' },
  { id: 'qualified', title: 'Cualificados', color: 'border-emerald-400', bg: 'bg-emerald-50/50', text: 'text-emerald-700' },
  { id: 'visiting', title: 'Visitando', color: 'border-cyan-400', bg: 'bg-cyan-50/50', text: 'text-cyan-700' },
  { id: 'proposal', title: 'Propuesta', color: 'border-amber-400', bg: 'bg-amber-50/50', text: 'text-amber-700' },
  { id: 'negotiation', title: 'Negociación', color: 'border-orange-400', bg: 'bg-orange-50/50', text: 'text-orange-700' },
  { id: 'closed', title: 'Ganados', color: 'border-slate-800', bg: 'bg-slate-100', text: 'text-slate-800' },
];

export default function Pipeline() {
  const navigate = useNavigate();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  // React Query para obtener todos los leads activos
  const { data, isLoading: loading } = useLeads({
    page: 1,
    pageSize: 1000, // En el pipeline queremos ver todos los activos a la vez
    statusFilter: undefined, // No filtramos por status aquí porque los separamos por columnas
    sortField: 'created_at',
    sortDirection: 'desc'
  });

  const updateMutation = useUpdateLead();
  const leads = (data?.leads || []).filter(l => l.status !== 'lost');

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', leadId);

    setTimeout(() => {
      const element = document.getElementById(`lead-card-${leadId}`);
      if (element) element.classList.add('opacity-50');
    }, 0);
  };

  const handleDragEnd = (_e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(null);
    const element = document.getElementById(`lead-card-${leadId}`);
    if (element) element.classList.remove('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;

    if (!leadId) return;

    const leadToMove = leads.find(l => l.id === leadId);
    if (!leadToMove || leadToMove.status === newStatus) return;

    // Actualización mediante mutación de React Query
    updateMutation.mutate({
      id: leadId,
      updates: { status: newStatus as any }
    });
    
    setDraggedLeadId(null);
  };

  const getSourceIcon = (sourceName: string | null) => {
    if (!sourceName) return <HelpCircle size={12} />;
    const lower = sourceName.toLowerCase();
    if (lower.includes('web') || lower.includes('google')) return <Globe size={12} />;
    if (lower.includes('insta') || lower.includes('facebook')) return <Smartphone size={12} />;
    if (lower.includes('referido') || lower.includes('amigo')) return <Users size={12} />;
    return <HelpCircle size={12} />;
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-slate-400 gap-4">
        <Loader2 className="animate-spin" size={40} />
        <p className="font-medium animate-pulse">Cargando tablero de ventas...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] animate-in fade-in duration-500 overflow-hidden">
      <div className="flex justify-between items-end mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Fases de Venta</h1>
          <p className="text-slate-500 text-sm mt-1">Arrastra las tarjetas para avanzar de fase.</p>
        </div>
        <div className="text-sm font-bold text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
          Total Activos: <span className="text-slate-900">{leads.length}</span>
        </div>
      </div>

      <div className="flex-1 flex gap-2 md:gap-3 overflow-hidden pb-6">
        {COLUMNS.map(column => {
          const columnLeads = leads.filter(lead => (lead.status || 'new') === column.id);
          const totalValue = columnLeads.length;

          return (
            <div
              key={column.id}
              className={`flex flex-col min-w-0 w-full flex-1 rounded-2xl border ${column.bg} border-slate-200 shadow-sm`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className={`p-3 border-b border-slate-200/50 flex justify-between items-center rounded-t-2xl bg-white/50 backdrop-blur-sm border-t-4 ${column.color}`}>
                <h3 className={`font-bold text-xs sm:text-sm ${column.text} uppercase tracking-wider truncate mr-2`}>
                  {column.title}
                </h3>
                <span className="bg-white text-slate-700 px-2 py-1 rounded-md text-xs font-bold border border-slate-200 shadow-sm shrink-0">
                  {totalValue}
                </span>
              </div>

              <div className="p-2 sm:p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                {columnLeads.length === 0 ? (
                  <div className="h-24 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-xs font-medium bg-white/40 text-center px-4">
                    Arrastra aquí
                  </div>
                ) : (
                  columnLeads.map(lead => (
                    <div
                      key={lead.id}
                      id={`lead-card-${lead.id}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onDragEnd={(e) => handleDragEnd(e, lead.id)}
                      onClick={() => setSelectedLead(lead)}
                      onDoubleClick={() => navigate(`/leads?search=${encodeURIComponent(lead.name)}`)}
                      className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-emerald-300 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h4 className="font-bold text-slate-900 text-[10px] sm:text-xs leading-tight break-words group-hover:text-emerald-700 transition-colors">
                          {lead.name}
                        </h4>
                        <button className="text-slate-300 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100 hidden sm:block shrink-0">
                          <MoreHorizontal size={14} />
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 px-1.5 py-1 rounded border border-slate-100 w-fit">
                          {getSourceIcon(lead.source)}
                          <span className="truncate max-w-[60px] sm:max-w-[80px]">{lead.source || 'Directo'}</span>
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium whitespace-nowrap">
                          {new Date(lead.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={() => {
            // React Query se encarga de invalidar las queries, así que no necesitamos una función local
            setSelectedLead(null);
          }}
        />
      )}
    </div>
  );
}