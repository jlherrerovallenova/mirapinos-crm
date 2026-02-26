// src/pages/Inventory.tsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Home, 
  Euro, 
  Maximize2, 
  Edit3, 
  Trash2, 
  Loader2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CreatePropertyModal } from '../components/inventory/CreatePropertyModal';

interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  type: string;
  status: string;
  bedrooms: number;
  bathrooms: number;
  surface: number;
  image_url: string | null;
}

const Inventory: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error cargando propiedades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta propiedad?')) return;
    
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProperties(properties.filter(p => p.id !== id));
    } catch (error) {
      alert('Error al eliminar la propiedad');
    }
  };

  const filteredProperties = properties.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Cabecera compacta */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Inventario de Propiedades</h1>
          <p className="text-xs text-slate-500">{properties.length} propiedades registradas</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar propiedad..."
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => {
              setEditingProperty(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shrink-0"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nueva</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-emerald-600 mb-2" size={32} />
          <p className="text-sm text-slate-500">Cargando inventario...</p>
        </div>
      ) : (
        /* Cuadrícula de fichas pequeñas */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProperties.map((property) => (
            <div 
              key={property.id} 
              className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-all flex h-32"
            >
              {/* Miniatura de imagen */}
              <div className="w-32 h-full bg-slate-100 shrink-0 relative">
                {property.image_url ? (
                  <img 
                    src={property.image_url} 
                    alt={property.title} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Home size={24} />
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shadow-sm ${
                    property.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {property.status === 'available' ? 'Disponible' : 'Reservado'}
                  </span>
                </div>
              </div>

              {/* Contenido de la ficha */}
              <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-sm font-bold text-slate-800 truncate" title={property.title}>
                      {property.title}
                    </h3>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setEditingProperty(property);
                          setIsModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(property.id)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-slate-500 mt-1">
                    <MapPin size={12} className="shrink-0" />
                    <p className="text-[11px] truncate">{property.address}</p>
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <div className="text-emerald-700 font-bold text-sm">
                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(property.price)}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-lg">
                    <span>{property.bedrooms} Dorm.</span>
                    <span>•</span>
                    <span>{property.surface} m²</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredProperties.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-2xl">
              <Home className="mx-auto text-slate-200 mb-3" size={40} />
              <p className="text-sm text-slate-400">No se encontraron propiedades.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal para Crear/Editar */}
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
        propertyToEdit={editingProperty}
      />
    </div>
  );
};

export default Inventory;