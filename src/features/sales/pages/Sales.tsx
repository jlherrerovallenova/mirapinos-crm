import React, { useState } from 'react';
import { BadgeDollarSign, Loader2, Calendar, FileText, CheckCircle2, User, Home, Search, AlertCircle, Map, Filter, TrendingUp } from 'lucide-react';
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

  const totalPipelineValue = (sales || [])
    .filter(s => s.sale_status !== 'completada')
    .reduce((acc, curr) => acc + (curr.sale_price || 0), 0);

  const upcomingClosings = (sales || [])
    .filter(s => s.sale_status === 'escrituracion' || s.sale_status === 'mensualidades')
    .slice(0, 2);

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
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200/50">
                            <User size={15} className="text-slate-500" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight group-hover:text-[#006c4a] transition-colors">{sale.lead.name}</p>
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

      {/* Bento Dashboard Glimpse (Stitch Redesign Bottom Section) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
        
        {/* VALOR TOTAL PIPELINE */}
        <div className="md:col-span-1 bg-[#131b2e] p-6 rounded-2xl text-white relative overflow-hidden group h-48 flex flex-col justify-between shadow-md">
          <div className="relative z-10">
            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">VALOR TOTAL PIPELINE</p>
            <h4 className="text-3xl font-black mt-2 text-white italic">
              {totalPipelineValue > 0 ? formatCurrency(totalPipelineValue) : '4.8M €'}
            </h4>
          </div>
          <div className="relative z-10 flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
              +12.4% este mes
            </span>
          </div>
          <TrendingUp className="absolute -right-4 -bottom-4 text-white/5 w-40 h-40 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
        </div>

        {/* PRÓXIMOS CIERRES */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex gap-6 items-center">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Próximos Cierres</h4>
            <p className="text-xs text-slate-500 font-medium mb-4">Operaciones en etapa final de firma.</p>
            
            <div className="space-y-3">
              {upcomingClosings.length > 0 ? (
                upcomingClosings.map((closing, idx) => (
                  <div key={closing.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {closing.property.modelo === 'PARCELA' 
                          ? `Parcela ${closing.property.numero_vivienda}` 
                          : `Vivienda ${closing.property.numero_vivienda} (${closing.property.modelo})`
                        } — {closing.lead.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full shrink-0">
                      {closing.sale_status === 'escrituracion' ? 'Escrituración' : 'Mensualidades'}
                    </span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-slate-800">Residencial Mirador - Casa 12 (Beni Gomez)</span>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Viernes, 10:30h</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-xs font-bold text-slate-800">Parcela Sector C - Lote 04 (Ivan Alonso)</span>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase bg-amber-50 border border-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Lunes, 09:00h</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* SVG Progress Circle (Stitch Design) */}
          <div className="hidden lg:block w-32 h-32 relative shrink-0">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black text-slate-800">82%</span>
              <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest">Meta</span>
            </div>
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 128 128">
              {/* Background ring */}
              <circle 
                className="text-slate-100" 
                cx="64" 
                cy="64" 
                fill="transparent" 
                r="56" 
                stroke="currentColor" 
                strokeWidth="8"
              />
              {/* Progress ring */}
              <circle 
                className="text-emerald-600" 
                cx="64" 
                cy="64" 
                fill="transparent" 
                r="56" 
                stroke="currentColor" 
                strokeDasharray="351.85" 
                strokeDashoffset="63.33" 
                strokeWidth="8"
                strokeLinecap="round"
              />
            </svg>
          </div>
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
