// src/pages/Pipeline.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Loader2, 
  Building2, 
  Globe, 
  Smartphone, 
  Users, 
  HelpCircle,
  MoreHorizontal
} from 'lucide-react';
import type { Database } from '../types/supabase';

type Lead = Database['public']['Tables']['leads']['Row'];

// Definición de las columnas del Kanban y sus estilos
const COLUMNS = [
  { id: 'new', title: 'Nuevos', color: 'border-blue-400', bg: 'bg-blue-50/50', text: 'text-blue-700' },
  { id: 'contacted', title: 'Contactados', color: 'border-purple-400', bg: 'bg-purple-50/50', text: 'text-purple-700' },
  { id: 'qualified', title: 'Cualificados', color: 'border-emerald-400', bg: 'bg-emerald-50/50', text: 'text-emerald-700' },
  { id: 'proposal', title: 'Propuesta', color: 'border-amber-400', bg: 'bg-amber-50/50', text: 'text-amber-700' },
  { id: 'negotiation', title: 'Negociación', color: 'border-orange-400', bg: 'bg-orange-50/50', text: 'text-orange-700' },
  { id: 'closed', title: 'Ganados', color: 'border-slate-800', bg: 'bg-slate-100', text: 'text-slate-800' },
];

export default function Pipeline() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para gestionar qué elemento se está arrastrando
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  useEffect(() => {
    fetchPipelineLeads();
  }, []);

  const fetchPipelineLeads = async () => {
    setLoading(true);
    try {
      // Excluimos los leads con estado 'lost' (Perdidos) del tablero principal para mantenerlo limpio
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .neq('status', 'lost')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setLeads(data);
    } catch (error) {
      console.error('Error fetching pipeline leads:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE DRAG & DROP NATIVO ---
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    // Efecto visual al arrastrar
    e.dataTransfer.effectAllowed = 'move';
    // Requerido por Firefox para que el drag funcione
    e.dataTransfer.setData('text/plain', leadId); 
    
    // Hacemos que la tarjeta original sea un poco transparente mientras se arrastra
    setTimeout(() => {
      const element = document.getElementById(`lead-card-${leadId}`);
      if (element) element.classList.add('opacity-50');
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(null);
    const element = document.getElementById(`lead-card-${leadId}`);
    if (element) element.classList.remove('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necesario para permitir el "Drop"
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    
    if (!leadId) return;

    const leadToMove = leads.find(l => l.id === leadId);
    if (!leadToMove || leadToMove.status === newStatus) return;

    // 1. Actualización Optimista (Actualiza la UI al instante sin esperar a la base de datos)
    setLeads(prev => prev.map(lead => 
      lead.id === leadId ? { ...lead, status: newStatus } : lead
    ));

    // 2. Actualización en Base de Datos (Supabase)
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', leadId);

      if (error) throw error;
    } catch (error) {
      console.error('Error actualizando estado en drop:', error);
      // Si falla, revertimos recargando los datos
      fetchPipelineLeads();
    }
    setDraggedLeadId(null);
  };

  // Helper visual para iconos de origen
  const getSourceIcon = (sourceName: string | null) => {
    if (!sourceName) return <HelpCircle size={12} />;
    const lower = sourceName.toLowerCase();
    if (lower.includes('web') || lower.includes('google')) return <Globe size={12} />;
    if (lower.includes('insta') || lower.includes('facebook')) return <Smartphone size={12} />;
    if (lower.includes('referido') || lower.includes('amigo')) return <Users size={12} />;
    return <HelpCircle size={12} />;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-slate-400 gap-4">
        <Loader2 className="animate-spin" size={40} />
        <p className="font-medium animate-pulse">Cargando tablero de ventas...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] animate-in fade-in duration-500 overflow-hidden">
      
      {/* HEADER DEL TABLERO */}
      <div className="flex justify-between items-end mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Pipeline de Ventas</h1>
          <p className="text-slate-500 text-sm mt-1">Arrastra las tarjetas para avanzar de fase.</p>
        </div>
        <div className="text-sm font-bold text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
          Total Activos: <span className="text-slate-900">{leads.length}</span>
        </div>
      </div>

      {/* CONTENEDOR KANBAN HORIZONTAL SCROLLABLE */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-6 snap-x">
        {COLUMNS.map(column => {
          // Filtramos los leads que pertenecen a esta columna
          const columnLeads = leads.filter(lead => (lead.status || 'new') === column.id);
          const totalValue = columnLeads.length;

          return (
            <div 
              key={column.id}
              className={`flex flex-col min-w-[320px] max-w-[320px] rounded-2xl border ${column.bg} border-slate-200 shadow-sm snap-center`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Cabecera de Columna */}
              <div className={`p-4 border-b border-slate-200/50 flex justify-between items-center rounded-t-2xl bg-white/50 backdrop-blur-sm border-t-4 ${column.color}`}>
                <h3 className={`font-bold text-sm ${column.text} uppercase tracking-wider`}>
                  {column.title}
                </h3>
                <span className="bg-white text-slate-700 px-2 py-1 rounded-md text-xs font-bold border border-slate-200 shadow-sm">
                  {totalValue}
                </span>
              </div>

              {/* Contenedor de Tarjetas (Scrollable vertical) */}
              <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                {columnLeads.length === 0 ? (
                  <div className="h-24 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-xs font-medium bg-white/40">
                    Arrastra un cliente aquí
                  </div>
                ) : (
                  columnLeads.map(lead => (
                    <div
                      key={lead.id}
                      id={`lead-card-${lead.id}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onDragEnd={(e) => handleDragEnd(e, lead.id)}
                      onClick={() => navigate(`/leads/${lead.id}`)}
                      className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-emerald-300 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-900 text-sm truncate pr-2 group-hover:text-emerald-700 transition-colors">
                          {lead.name}
                        </h4>
                        <button className="text-slate-300 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                      
                      {lead.company && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                          <Building2 size={12} className="text-slate-400" />
                          <span className="truncate font-medium">{lead.company}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded border border-slate-100">
                          {getSourceIcon(lead.source)}
                          <span className="truncate max-w-[80px]">{lead.source || 'Directo'}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
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
    </div>
  );
}