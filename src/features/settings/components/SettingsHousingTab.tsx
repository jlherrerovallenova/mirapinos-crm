import React, { useState, useEffect } from 'react';
import { Plus, Home, Copy, Edit3, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useDialog } from '../../../context/DialogContext';
import CreatePropertyModal from '../../../components/inventory/CreatePropertyModal';

const SettingsHousingTab: React.FC = () => {
  const { showConfirm, showAlert } = useDialog();

  const [properties, setProperties] = useState<any[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoadingProperties(true);
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('numero_vivienda', { ascending: true });

      if (error) throw error;
      setProperties(data || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoadingProperties(false);
    }
  };

  const handleDeleteProperty = async (property: any) => {
    const confirmed = await showConfirm({
      title: 'Eliminar Vivienda',
      message: `¿Estás seguro de que deseas eliminar la vivienda ${property.numero_vivienda}? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar'
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', property.id);

      if (error) throw error;
      setProperties(prev => prev.filter(p => p.id !== property.id));
      await showAlert({ title: 'Éxito', message: 'Vivienda eliminada correctamente' });
    } catch (error) {
      console.error('Error deleting property:', error);
      await showAlert({ title: 'Error', message: 'No se pudo eliminar la vivienda' });
    }
  };

  const handleCloneProperty = (property: any) => {
    const { id, created_at, ...cloneData } = property;
    setEditingProperty(cloneData);
    setIsPropertyModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Gestión de Inventario</h2>
          <p className="text-xs text-slate-500">Administra las propiedades, clona registros para nuevos modelos o elimina activos.</p>
        </div>
        <button
          onClick={() => {
            setEditingProperty(null);
            setIsPropertyModalOpen(true);
          }}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus size={16} /> Añadir Nueva
        </button>
      </div>

      <div className="flex-1 overflow-auto p-0">
        {loadingProperties ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
            <span className="text-sm font-medium text-slate-400">Cargando viviendas...</span>
          </div>
        ) : properties.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center opacity-60">
            <Home size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-500 font-bold">No hay viviendas en el catálogo</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Viv.</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Modelo</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Precio</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Acciones de Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {properties.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 font-black text-slate-700">#{p.numero_vivienda}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">{p.modelo}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">
                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(p.precio)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => handleCloneProperty(p)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Clonar para nuevo registro"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingProperty(p);
                          setIsPropertyModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Editar datos"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteProperty(p)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Eliminar definitivamente"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isPropertyModalOpen && (
        <CreatePropertyModal
          isOpen={isPropertyModalOpen}
          onClose={() => {
            setIsPropertyModalOpen(false);
            setEditingProperty(null);
          }}
          onSuccess={() => {
            fetchProperties();
            setIsPropertyModalOpen(false);
          }}
          initialData={editingProperty}
        />
      )}
    </div>
  );
};

export default SettingsHousingTab;
