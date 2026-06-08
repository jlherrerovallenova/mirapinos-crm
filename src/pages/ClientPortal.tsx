import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Download, FileText, CheckCircle2, Circle, Euro, FileCheck, Calendar as CalendarIcon, MapPin, Building, Info } from 'lucide-react';
import type { Database } from '../types/supabase';

type Sale = Database['public']['Tables']['sales']['Row'];
type Installment = Database['public']['Tables']['installments']['Row'];
type SaleDocument = Database['public']['Tables']['sale_documents']['Row'];
type Inventory = Database['public']['Tables']['inventory']['Row'];

export default function ClientPortal() {
  const [loading, setLoading] = useState(true);
  const [sale, setSale] = useState<Sale | null>(null);
  const [property, setProperty] = useState<Inventory | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [documents, setDocuments] = useState<SaleDocument[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClientData();
  }, []);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      // 1. Fetch sales
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (salesError) throw salesError;

      if (!salesData || salesData.length === 0) {
        setSale(null);
        setLoading(false);
        return;
      }

      const currentSale = salesData[0] as any;
      setSale(currentSale);

      // 2. Fetch Property
      if (currentSale.property_id) {
        const { data: propData } = await supabase
          .from('inventory')
          .select('*')
          .eq('id', currentSale.property_id)
          .single();
        if (propData) setProperty(propData);
      }

      // 3. Fetch Installments
      const { data: instData } = await supabase
        .from('installments')
        .select('*')
        .eq('sale_id', currentSale.id)
        .order('installment_number', { ascending: true });
      if (instData) setInstallments(instData);

      // 4. Fetch Documents
      const { data: docsData } = await supabase
        .from('sale_documents')
        .select('*')
        .eq('sale_id', currentSale.id)
        .order('created_at', { ascending: false });
      if (docsData) setDocuments(docsData);

    } catch (err: any) {
      console.error('Error fetching client data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: SaleDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('sale-documents')
        .download(doc.file_path);

      if (error) throw error;

      // Create a download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Download error:', error);
      alert('Error al descargar el documento.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-emerald-600 h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200">
        <h3 className="font-bold text-lg mb-2">Error cargando tu expediente</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Info className="text-slate-400 h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Aún no hay expedientes activos</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          No hemos encontrado ninguna operación de compraventa asociada a tu cuenta. 
          Si crees que es un error, por favor contacta con tu agente.
        </p>
      </div>
    );
  }

  // Cálculos económicos
  const formatCurrency = (val: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);
  
  const totalConIva = sale.sale_price;
  const ivaMultiplier = 1 + (sale.iva_percentage / 100);
  const baseImponible = totalConIva / ivaMultiplier;
  const importeIva = totalConIva - baseImponible;

  const paidInstallmentsSum = installments.filter(i => i.paid).reduce((acc, i) => acc + i.amount, 0);
  // Asumimos que la reserva está pagada si el estado es mayor o igual a reserva (que lo es siempre que exista la venta)
  const totalPagado = sale.reservation_amount + paidInstallmentsSum;
  const totalPendiente = totalConIva - totalPagado;

  // Fases
  const phases = ['reserva', 'contrato', 'mensualidades', 'escrituracion', 'completada'];
  const currentPhaseIndex = phases.indexOf(sale.sale_status || 'reserva');

  const getPhaseName = (phase: string) => {
    const names: Record<string, string> = {
      'reserva': 'Reserva',
      'contrato': 'Contrato',
      'mensualidades': 'Mensualidades',
      'escrituracion': 'Escrituración',
      'completada': 'Completada'
    };
    return names[phase] || phase;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER PROPIEDAD */}
      <div className="bg-gradient-to-br from-emerald-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Building size={200} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-300 font-bold text-xs uppercase tracking-wider rounded-full mb-4 border border-emerald-500/30">
              Expediente Activo
            </span>
            <h1 className="text-4xl font-display font-bold mb-2">
              {property ? `Vivienda ${property.numero_vivienda}` : 'Propiedad en trámite'}
            </h1>
            {property && (
              <div className="flex items-center gap-4 text-emerald-100/80 text-sm">
                <span className="flex items-center gap-1.5"><MapPin size={16} /> Residencial Mirapinos</span>
                <span className="flex items-center gap-1.5"><Building size={16} /> Modelo {property.modelo}</span>
              </div>
            )}
          </div>
          <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10">
            <p className="text-emerald-100 text-sm font-medium mb-1">Precio Total (IVA Inc.)</p>
            <p className="text-3xl font-bold">{formatCurrency(totalConIva)}</p>
          </div>
        </div>
      </div>

      {/* PIPELINE / FASES */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <FileCheck className="text-emerald-500" size={20} /> Progreso de la Operación
        </h3>
        
        <div className="relative">
          {/* Línea de conexión de fondo */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full hidden md:block"></div>
          {/* Línea de progreso activa */}
          <div 
            className="absolute top-1/2 left-0 h-1 bg-emerald-500 -translate-y-1/2 rounded-full hidden md:block transition-all duration-700"
            style={{ width: `${(currentPhaseIndex / (phases.length - 1)) * 100}%` }}
          ></div>

          <div className="flex flex-col md:flex-row justify-between gap-4 md:gap-0 relative z-10">
            {phases.map((phase, index) => {
              const isCompleted = index < currentPhaseIndex;
              const isCurrent = index === currentPhaseIndex;
              
              return (
                <div key={phase} className="flex md:flex-col items-center gap-4 md:gap-2 text-center flex-1">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border-2 transition-colors duration-300
                    ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 
                      isCurrent ? 'bg-white border-emerald-500 text-emerald-600 shadow-emerald-500/20' : 
                      'bg-white border-slate-200 text-slate-300'}
                  `}>
                    {isCompleted ? <CheckCircle2 size={20} /> : <Circle size={14} className={isCurrent ? 'fill-emerald-500' : ''} />}
                  </div>
                  <div className="flex-1 md:w-full md:px-2 flex flex-col md:items-center items-start">
                    <p className={`font-bold text-sm ${isCurrent ? 'text-emerald-700' : isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                      {getPhaseName(phase)}
                    </p>
                    {isCurrent && <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mt-1">Fase Actual</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: Finanzas */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-sm font-bold mb-1 uppercase tracking-wide">Total Pagado</p>
              <p className="text-3xl font-bold text-emerald-600">{formatCurrency(totalPagado)}</p>
              <p className="text-xs text-slate-400 mt-2 font-medium">Incluye reserva y cuotas</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-sm font-bold mb-1 uppercase tracking-wide">Total Pendiente</p>
              <p className="text-3xl font-bold text-amber-500">{formatCurrency(totalPendiente)}</p>
              <p className="text-xs text-slate-400 mt-2 font-medium">Hasta escrituración</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-sm font-bold mb-1 uppercase tracking-wide">Desglose Fiscal</p>
              <div className="space-y-1 mt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Base Imp.</span>
                  <span className="font-bold">{formatCurrency(baseImponible)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">IVA ({sale.iva_percentage}%)</span>
                  <span className="font-bold">{formatCurrency(importeIva)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Euro className="text-emerald-500" size={20} /> Plan de Cuotas
              </h3>
            </div>
            
            {installments.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <CalendarIcon className="mx-auto h-8 w-8 mb-3 text-slate-300" />
                No hay cuotas mensuales configuradas aún.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-medium">
                    <tr>
                      <th className="px-6 py-3">Nº Cuota</th>
                      <th className="px-6 py-3">Vencimiento</th>
                      <th className="px-6 py-3 text-right">Importe</th>
                      <th className="px-6 py-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {installments.map((inst) => (
                      <tr key={inst.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-700">Cuota {inst.installment_number}</td>
                        <td className="px-6 py-4 text-slate-600">{new Date(inst.due_date).toLocaleDateString('es-ES')}</td>
                        <td className="px-6 py-4 text-right font-bold">{formatCurrency(inst.amount)}</td>
                        <td className="px-6 py-4 text-center">
                          {inst.paid ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                              <CheckCircle2 size={12} /> Pagado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                              <Circle size={12} /> Pendiente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* COLUMNA DERECHA: Documentos */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="text-emerald-500" size={20} /> Mis Documentos
              </h3>
              <p className="text-xs text-slate-500 mt-1">Aquí encontrarás copias de tus contratos y justificantes.</p>
            </div>
            <div className="p-4 space-y-3">
              {documents.length === 0 ? (
                <div className="text-center text-slate-500 py-6 text-sm">
                  Aún no hay documentos subidos a tu expediente.
                </div>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="group flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 shrink-0 transition-colors">
                      <FileText size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate" title={doc.name}>{doc.name}</p>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">{doc.document_type}</p>
                    </div>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors shrink-0"
                      title="Descargar documento"
                    >
                      <Download size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
