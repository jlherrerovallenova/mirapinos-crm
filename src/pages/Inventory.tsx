import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AppNotification } from '../components/Shared';
import CreatePropertyModal from '../components/inventory/CreatePropertyModal';
import { Plus, Building2, MapPin, Tag, Loader2 } from 'lucide-react';
import type { Database } from '../types/supabase';

type Property = Database['public']['Tables']['properties']['Row'];

export default function Inventory() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean; title: string; message: string; type: 'success' | 'error' | 'info';
  }>({ show: false, title: '', message: '', type: 'success' });

  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setProperties(data);
    } catch (error) {
      console.error("Error cargando inventario:", error);
    } finally {
      setLoading(false);
    }
  }

  const showNotif = (title: string, message: string) => {
    setNotification({ show: true, title, message, type: 'success' });
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-emerald-600 font-bold uppercase tracking-[0.3em] text-[10px] mb-2">Activos Disponibles</p>
          <h1 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Inventario</h1>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 transition-all flex items-center gap-3 active:scale-95"
        >
          <Plus size={20} /> AÑADIR PROPIEDAD
        </button>
      </header>

      {loading ? (
        <div className="p-20 flex justify-center">
          <Loader2 className="animate-spin text-emerald-600" size={40}/>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((prop) => (
            <div key={prop.id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all group">
              <div className="h-48 bg-slate-50 rounded-2xl mb-6 flex items-center justify-center text-slate-200 overflow-hidden">
                {prop.image_url ? (
                   <img src={prop.image_url} alt={prop.name} className="w-full h-full object-cover" />
                ) : (
                   <Building2 size={48} />
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">{prop.name}</h3>
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
                <MapPin size={14} />
                <span>{prop.location}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-emerald-600" />
                  <span className="text-lg font-bold text-slate-900">
                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(prop.price)}
                  </span>
                </div>
                <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg ${
                  prop.status === 'Disponible' ? 'bg-emerald-50 text-emerald-600' : 
                  prop.status === 'Reservado' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  {prop.status}
                </span>
              </div>
            </div>
          ))}
          {properties.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-400 italic">
              No hay propiedades registradas todavía.
            </div>
          )}
        </div>
      )}

      <CreatePropertyModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchProperties();
          showNotif("INVENTARIO ACTUALIZADO", "Propiedad guardada correctamente.");
        }}
      />

      {notification.show && (
        <AppNotification 
          title={notification.title}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      )}
    </div>
  );
}