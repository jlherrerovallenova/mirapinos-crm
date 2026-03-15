// src/pages/Inventory.tsx
import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  Home,
  BedDouble,
  Bath,
  AlertTriangle,
  Filter,
  Copy
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import CreatePropertyModal from '../components/inventory/CreatePropertyModal';
import { useDialog } from '../context/DialogContext';

interface Property {
  id: string;
  modelo: string;
  numero_vivienda: string;
  superficie_parcela: number;
  superficie_util: number;
  superficie_construida: number;
  habitaciones: number;
  banos: number;
  precio: number;
  estado_vivienda?: string;
  created_at: string;
}

export default function Inventory() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const { showAlert } = useDialog();

  // Estados para el nuevo modal de confirmación de borrado
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('numero_vivienda', { ascending: true });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!propertyToDelete) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', propertyToDelete.id);

      if (error) throw error;

      setProperties(prev => prev.filter(p => p.id !== propertyToDelete.id));
      setPropertyToDelete(null);
    } catch (error) {
      console.error('Error deleting property:', error);
      await showAlert({ title: 'Error', message: 'Error al intentar eliminar el registro.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClone = (property: Property) => {
    // Para clonar, pasamos los datos pero SIN el ID
    const { id, created_at, ...cloneData } = property;
    setEditingProperty(cloneData as any);
    setIsModalOpen(true);
  };

  const filteredProperties = properties.filter(p => {
    const matchesSearch = p.modelo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.numero_vivienda.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = stateFilter === '' || p.estado_vivienda === stateFilter;
    return matchesSearch && matchesState;
  });

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Inventario de Viviendas</h1>
          <p className="text-slate-500 mt-1 font-medium">Gestión profesional del catálogo de activos.</p>
        </div>
        <button
          onClick={() => {
            setEditingProperty(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg transition-all active:scale-95"
        >
          <Plus size={20} />
          Añadir Propiedad
        </button>
      </div>

      {/* Buscador y Filtros */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Buscar por modelo o número de vivienda..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-medium text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative w-full md:w-64">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="w-full pl-12 pr-8 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none cursor-pointer text-slate-700 font-medium font-bold"
          >
            <option value="">Cualquier Estado</option>
            <option value="DISPONIBLE">DISPONIBLE</option>
            <option value="NO DISPONIBLE">NO DISPONIBLE</option>
            <option value="BLOQUEADA">BLOQUEADA</option>
            <option value="RESERVADA">RESERVADA</option>
            <option value="CONTRATO CV">CONTRATO CV</option>
            <option value="ESCRITURADA">ESCRITURADA</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-emerald-600" size={40} />
            <p className="text-slate-400 font-medium">Cargando inventario...</p>
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Vivienda</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Modelo</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Hab / Baños</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Precio</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProperties.map((property) => (
                  <tr key={property.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                          {property.numero_vivienda}
                        </div>
                        <span className="font-bold text-slate-900">Urb. Mirapinos</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-semibold text-slate-600">{property.modelo}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-4 text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <BedDouble size={16} />
                          <span className="font-bold">{property.habitaciones}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Bath size={16} />
                          <span className="font-bold">{property.banos}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex px-3 py-1 rounded-lg bg-slate-900 text-white font-bold text-sm">
                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(property.precio)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleClone(property)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Clonar Vivienda"
                        >
                          <Copy size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingProperty(property);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => setPropertyToDelete(property)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Borrar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center">
            <Home size={40} className="text-slate-200 mb-4" />
            <p className="text-slate-500 font-bold">No se encontraron propiedades</p>
          </div>
        )}
      </div>

      {/* Modal de Confirmación de Borrado Profesional */}
      {propertyToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">¿Eliminar vivienda?</h3>
              <p className="text-slate-500 font-medium mb-8">
                Estás a punto de borrar la vivienda <span className="text-slate-900 font-bold">{propertyToDelete.numero_vivienda}</span> (Modelo {propertyToDelete.modelo}). Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPropertyToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-4 bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-100 hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 className="animate-spin" size={20} /> : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <CreatePropertyModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProperty(null);
          }}
          onSuccess={() => {
            fetchProperties();
            setIsModalOpen(false);
          }}
          initialData={editingProperty}
        />
      )}
    </div>
  );
}