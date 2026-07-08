import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeDollarSign, Loader2, Calendar, FileText, CheckCircle2, User, Home, Search, AlertCircle, Map, Filter } from 'lucide-react';
import { useSales } from '../hooks/useSales';
import SaleDocumentsModal from '../components/SaleDocumentsModal';
import type { Database } from '../../../types/supabase';

type SaleBase = Database['public']['Tables']['sales']['Row'];
type LeadBase = Database['public']['Tables']['leads']['Row'];
type PropertyBase = Database['public']['Tables']['inventory']['Row'];

type Sale = SaleBase & {
  lead: LeadBase;
  property: PropertyBase;
};

const STATUS_CONFIG: Record<string, { label: string, color: string, icon: React.ReactNode }> = {
  reserva: { label: 'Reserva', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Calendar size={12} /> },
  contrato: { label: 'Contrato', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <FileText size={12} /> },
  mensualidades: { label: 'Mensualidades', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: <BadgeDollarSign size={12} /> },
  escrituracion: { label: 'Escrituración', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: <FileText size={12} /> },
  completada: { label: 'Cerrada', color: 'bg-emerald-100 text-emerald-700 border-emerald-200/50', icon: <CheckCircle2 size={12} /> }
};

export default function Sales() {
  const navigate = useNavigate();
  const { data: sales, isLoading } = useSales();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSaleForDocs, setSelectedSaleForDocs] = useState<Sale | null>(null);

  const formatCurrency = (val: number | null) => {
    if (val === null || isNaN(val)) return '-';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const filteredSales = (sales || []).filter(sale => {
    const matchesSearch = 
      sale.lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.property.numero_vivienda.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || sale.sale_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalSalesValue = (sales || [])
    .reduce((acc, curr) => acc + (curr.sale_price || 0), 0);



  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-slate-400 gap-4">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
        <p className="font-medium animate-pulse">Cargando datos de ventas...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col animate-in fade-in duration-500 max-w-[1600px] mx-auto w-full gap-6 pb-10">
      
      {/* Header Section (Stitch Redesign) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center">
            <BadgeDollarSign size={36} className="text-[#006c4a]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Ventas y Operaciones</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-black text-[#006c4a]">{formatCurrency(totalSalesValue)}</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">en total de ventas</span>
            </div>
          </div>
        </div>
        
        {/* Tabs/Segments Filters (Stitch Redesign) */}
        <div className="bg-slate-100 p-1 rounded-xl flex gap-1 self-start md:self-auto shrink-0 shadow-sm border border-slate-200/30">
          <button 
            onClick={() => setStatusFilter('all')}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'all' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Todas las operaciones
          </button>
          <button 
            onClick={() => setStatusFilter('completada')}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'completada' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Ventas Cerradas
          </button>
        </div>
      </div>

      {/* Operations Table Card (Stitch Redesign) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Historial de Operaciones</span>
          
          <div className="flex items-center gap-4 flex-1 max-w-md justify-end">
            {/* Search Input (Stitch Redesign) */}
            <div className="relative w-full max-w-xs focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl transition-all">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Buscar por cliente o vivienda..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-12 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all text-xs font-semibold text-slate-700 placeholder-slate-400"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[9px] font-bold text-slate-400 bg-slate-200/80 px-1.5 py-0.5 rounded">⌘K</span>
            </div>
            
            <button className="flex items-center gap-1.5 font-bold text-xs text-[#006c4a] hover:underline transition-all">
              <Filter size={14} />
              <span>Filtros Avanzados</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-3.5 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Cliente</th>
                <th className="px-6 py-3.5 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Vivienda/Parcela</th>
                <th className="px-6 py-3.5 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Estado</th>
                <th className="px-6 py-3.5 font-bold text-slate-500 uppercase text-[10px] tracking-wider text-right">Precio Venta</th>
                <th className="px-6 py-3.5 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Fecha Cierre</th>
                <th className="px-6 py-3.5 font-bold text-slate-500 uppercase text-[10px] tracking-wider text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle size={32} className="text-slate-300" />
                      <p className="font-medium">No se encontraron operaciones con los filtros actuales</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => {
                  const statusConf = STATUS_CONFIG[sale.sale_status] || STATUS_CONFIG.reserva;
                  
                  return (
                    <tr 
                      key={sale.id} 
                      className="hover:bg-slate-50/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedSaleForDocs(sale as any)}
                    >
                      <td 
                        className="px-6 py-3.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/leads?open=${sale.lead.id}`);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200/50">
                            <User size={15} className="text-slate-500" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight hover:text-[#006c4a] hover:underline transition-colors">{sale.lead.name}</p>
                            <p className="text-[11px] text-slate-500 font-medium">{sale.lead.phone || sale.lead.email || 'Sin contacto'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2 text-slate-800">
                          {sale.property.modelo === 'PARCELA' ? (
                            <>
                              <Map size={14} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                              <span className="font-bold">Parcela {sale.property.numero_vivienda}</span>
                            </>
                          ) : (
                            <>
                              <Home size={14} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                              <div>
                                <span className="font-bold">Vivienda {sale.property.numero_vivienda}</span>
                                <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">({sale.property.modelo})</span>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${statusConf.color}`}>
                          {statusConf.icon}
                          {statusConf.label.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span className="font-black text-slate-900">{formatCurrency(sale.sale_price)}</span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 font-semibold text-xs">
                        {formatDate(sale.escritura_date || sale.contract_date)}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <button 
                          className="px-4 py-1.5 rounded-lg border border-[#006c4a] text-[#006c4a] font-bold text-xs hover:bg-[#006c4a] hover:text-white transition-all active:scale-95 shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSaleForDocs(sale as any);
                          }}
                        >
                          Ver Detalles
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Table Footer with Summary */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <p>Mostrando {filteredSales.length} de {sales?.length || 0} operaciones</p>
        </div>
      </div>

      {selectedSaleForDocs && (
        <SaleDocumentsModal
          sale={selectedSaleForDocs}
          onClose={() => setSelectedSaleForDocs(null)}
        />
      )}
    </div>
  );
}
