import React, { useState, useEffect } from 'react';
import { Upload, Download, Search, Trash2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useDialog } from '../../../context/DialogContext';
import { useQueryClient } from '@tanstack/react-query';
import ExportLeadsModal from '../../leads/components/ExportLeadsModal';
import ImportLeadsModal from '../../leads/components/ImportLeadsModal';

const SettingsDataTab: React.FC = () => {
  const { showConfirm, showAlert } = useDialog();
  const queryClient = useQueryClient();

  const [settingsLeads, setSettingsLeads] = useState<any[]>([]);
  const [loadingSettingsLeads, setLoadingSettingsLeads] = useState(false);
  const [searchClientQuery, setSearchClientQuery] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    fetchSettingsLeads();
  }, []);

  const fetchSettingsLeads = async () => {
    try {
      setLoadingSettingsLeads(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSettingsLeads(data || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoadingSettingsLeads(false);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    const leadToDelete = settingsLeads.find(l => l.id === leadId);
    if (leadToDelete && leadToDelete.sale_status) {
      showAlert({ 
        title: 'Operación denegada', 
        message: 'No puedes borrar este cliente porque tiene una operación de compra en curso o finalizada.' 
      });
      return;
    }

    const password = window.prompt("Por seguridad, introduce la contraseña de administrador para borrar este cliente:");
    if (password !== "mirapinos2026") {
      if (password !== null) {
        showAlert({ title: 'Error', message: 'Contraseña incorrecta. Operación cancelada.' });
      }
      return;
    }

    const confirmed = await showConfirm({
      title: 'Eliminar Cliente',
      message: '¿Estás seguro de que deseas eliminar este cliente y TODA su agenda asociada? Esta acción es irreversible.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar'
    });
    if (!confirmed) return;

    try {
      await supabase.from('agenda').delete().eq('lead_id', leadId);
      
      const { error } = await supabase.from('leads').delete().eq('id', leadId);
      if (error) throw error;
      
      showAlert({ title: 'Éxito', message: 'Cliente eliminado correctamente.' });
      fetchSettingsLeads();
    } catch (err: any) {
      console.error('Error eliminando lead:', err);
      showAlert({ title: 'Error', message: 'No se pudo eliminar el cliente: ' + (err.message || 'Error desconocido') });
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <div className="border-b pb-2">
        <h2 className="text-lg font-semibold text-slate-800">Clientes</h2>
        <p className="text-xs text-slate-500">Herramientas administrativas para la importación y exportación masiva de contactos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-emerald-400 transition-all flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:rotate-12 transition-transform">
              <Upload size={24} />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Importar Clientes</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Carga masiva de contactos a través de archivos Excel o CSV. Mapea columnas para importar nombres, emails, teléfonos y orígenes de forma automatizada.
            </p>
          </div>
          <div className="mt-6">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
            >
              <Upload size={16} />
              Importar CSV
            </button>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-blue-400 transition-all flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:rotate-12 transition-transform">
              <Download size={24} />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Exportar Clientes</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Descarga un respaldo completo o parcial de todos tus contactos registrados en formato CSV, listo para usar en otras herramientas o mantener un backup local.
            </p>
          </div>
          <div className="mt-6">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
            >
              <Download size={16} />
              Exportar Listado
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <h3 className="font-bold text-slate-800 whitespace-nowrap">Gestión de Clientes</h3>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Buscar cliente para eliminar..." 
              value={searchClientQuery}
              onChange={(e) => setSearchClientQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-400 font-bold uppercase tracking-widest border-b border-slate-200">
                <th className="py-3 px-6">Nombre</th>
                <th className="py-3 px-6">Email</th>
                <th className="py-3 px-6">Teléfono</th>
                <th className="py-3 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingSettingsLeads ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    Cargando clientes...
                  </td>
                </tr>
              ) : searchClientQuery.trim().length < 2 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    Escribe al menos 2 letras en el buscador para encontrar un cliente.
                  </td>
                </tr>
              ) : (() => {
                const filtered = settingsLeads.filter(lead => 
                  (lead.name?.toLowerCase().includes(searchClientQuery.toLowerCase())) ||
                  (lead.email?.toLowerCase().includes(searchClientQuery.toLowerCase())) ||
                  (lead.phone?.includes(searchClientQuery))
                );
                
                if (filtered.length === 0) {
                  return (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No se encontraron clientes con "{searchClientQuery}".
                      </td>
                    </tr>
                  );
                }
                
                return filtered.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-6 text-sm font-medium text-slate-800">{lead.name || '-'}</td>
                    <td className="py-3 px-6 text-sm text-slate-500">{lead.email || '-'}</td>
                    <td className="py-3 px-6 text-sm text-slate-500">{lead.phone || '-'}</td>
                    <td className="py-3 px-6 text-right">
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors inline-flex items-center"
                        title="Eliminar Cliente"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      <ExportLeadsModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
      <ImportLeadsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['leads'] });
          showAlert({ title: 'Éxito', message: 'Los clientes han sido importados correctamente.' });
        }}
      />
    </div>
  );
};

export default SettingsDataTab;
