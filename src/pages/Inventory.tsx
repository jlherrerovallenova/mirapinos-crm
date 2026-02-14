// src/pages/Inventory.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Search, 
  Plus, 
  MapPin, 
  BedDouble, 
  Bath, 
  Square, 
  Loader2,
  Filter,
  Home,
  Tag
} from 'lucide-react';
import CreatePropertyModal from '../components/inventory/CreatePropertyModal';
import type { Database } from '../types/supabase';

type Property = Database['public']['Tables']['inventory']['Row'];

export default function Inventory() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setProperties(data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProperties = properties.filter(prop => {
    const matchesSearch = (prop.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          (prop.location?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || prop.type === filterType;
    return matchesSearch && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'reserved': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'sold': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-emerald-600 font-bold uppercase tracking-[0.3em] text-[10px] mb-2">Catálogo de Activos</p>
          <h1 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Inventario</h1>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95"
        >
          <Plus size={20} /> AÑADIR PROPIEDAD
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar por título o ubicación..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="px-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none shadow-sm cursor-pointer focus:ring-2 focus:ring-emerald-500/20"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Todos los tipos</option>
            <option value="house">Casas</option>
            <option value="apartment">Apartamentos</option>
            <option value="land">Terrenos</option>
            <option value="commercial">Comercial</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
          <Loader2 className="animate-spin" size={40} />
          <p className="font-medium animate-pulse">Sincronizando inventario...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProperties.map((prop) => (
            <div 
              key={prop.id} 
              className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col"
            >
              {/* Imagen/Placeholder */}
              <div className="relative h-56 bg-slate-200 overflow-hidden">
                {prop.image_url ? (
                  <img 
                    src={prop.image_url} 
                    alt={prop.title || ''} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Home size={48} strokeWidth={1} />
                  </div>
                )}
                <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-[10px] font-black uppercase border backdrop-blur-md ${getStatusColor(prop.status || 'available')}`}>
                  {prop.status}
                </div>
              </div>

              {/* Contenido */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-900 text-lg line-clamp-1">{prop.title}</h3>
                </div>
                
                <p className="flex items-center gap-1.5 text-slate-400 text-sm mb-4">
                  <MapPin size={14} className="text-emerald-500" /> {prop.location || 'Ubicación no disponible'}
                </p>

                <div className="grid grid-cols-3 gap-2 py-4 border-y border-slate-50 mb-6">
                  <div className="flex flex-col items-center text-slate-600">
                    <BedDouble size={18} className="mb-1 text-slate-400" />
                    <span className="text-xs font-bold">{prop.beds || 0} Hab.</span>
                  </div>
                  <div className="flex flex-col items-center text-slate-600 border-x border-slate-50">
                    <Bath size={18} className="mb-1 text-slate-400" />
                    <span className="text-xs font-bold">{prop.baths || 0} Baños</span>
                  </div>
                  <div className="flex flex-col items-center text-slate-600">
                    <Square size={16} className="mb-1 text-slate-400" />
                    <span className="text-xs font-bold">{prop.sqft || 0} m²</span>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Precio de venta</p>
                    <p className="text-2xl font-display font-bold text-slate-900">
                      {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(prop.price || 0)}
                    </p>
                  </div>
                  <button className="p-3 bg-slate-50 text-slate-400 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all">
                    <Tag size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreatePropertyModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={fetchProperties} 
      />
    </div>
  );
}