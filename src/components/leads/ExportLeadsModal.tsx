// src/components/leads/ExportLeadsModal.tsx
import { useState } from 'react';
import { X, Download, FileSpreadsheet, Loader2, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportLeadsModal({ isOpen, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'month'>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  if (!isOpen) return null;

  const handleExport = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('leads')
        .select('*')
        // CLAVE: Ordenamos por 'source' para que salgan clasificados por origen
        .order('source', { ascending: true })
        .order('created_at', { ascending: false });

      // Aplicar filtro de mes si es necesario
      if (filterType === 'month' && selectedMonth) {
        const [year, month] = selectedMonth.split('-');
        const startDate = new Date(Number(year), Number(month) - 1, 1).toISOString();
        const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59).toISOString();

        query = query.gte('created_at', startDate).lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (!data || data.length === 0) {
        alert('No hay datos para exportar en el periodo seleccionado.');
        setLoading(false);
        return;
      }

      // Generar CSV
      generateCSV(data);
      onClose();

    } catch (error) {
      console.error('Error exportando:', error);
      alert('Hubo un error al exportar los datos.');
    } finally {
      setLoading(false);
    }
  };

  const generateCSV = (data: any[]) => {
    // Definir cabeceras
    const headers = ['ID', 'Nombre', 'Email', 'Teléfono', 'Empresa', 'Origen', 'Estado', 'Fecha Creación', 'Notas'];
    
    // Convertir datos a formato CSV
    const csvContent = [
      headers.join(','),
      ...data.map(lead => {
        const row = [
          lead.id,
          `"${lead.name || ''}"`,
          lead.email || '',
          lead.phone || '',
          `"${lead.company || ''}"`,
          `"${lead.source || 'Desconocido'}"`, // Importante para la clasificación
          lead.status,
          new Date(lead.created_at).toLocaleDateString('es-ES'),
          `"${(lead.notes || '').replace(/"/g, '""')}"` // Escapar comillas en notas
        ];
        return row.join(',');
      })
    ].join('\n');

    // Crear Blob y descargar
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // \uFEFF para BOM (UTF-8 Excel)
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_mirapinos_${filterType === 'month' ? selectedMonth : 'todos'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="text-emerald-600" size={20} />
            Exportar Clientes
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-slate-500">
            Selecciona el rango de fechas para generar el listado. El archivo estará <strong>clasificado por Origen</strong>.
          </p>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
              <input 
                type="radio" 
                name="filter" 
                checked={filterType === 'all'} 
                onChange={() => setFilterType('all')}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-bold text-slate-700">Exportar todo el histórico</span>
            </label>

            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
              <input 
                type="radio" 
                name="filter" 
                checked={filterType === 'month'} 
                onChange={() => setFilterType('month')}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <div className="flex-1">
                <span className="text-sm font-bold text-slate-700 block mb-1">Filtrar por mes</span>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" />
                  <input 
                    type="month" 
                    value={selectedMonth}
                    disabled={filterType !== 'month'}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="text-xs bg-transparent border-none p-0 focus:ring-0 text-slate-600 font-medium disabled:opacity-50"
                  />
                </div>
              </div>
            </label>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors text-xs"
            >
              Cancelar
            </button>
            <button
              onClick={handleExport}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
              Descargar CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}