// src/components/inventory/CreatePropertyModal.tsx
import React, { useState } from 'react';
import { 
  X, 
  Home, 
  MapPin, 
  BedDouble, 
  Bath, 
  Square, 
  Euro, 
  Loader2, 
  Save,
  Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePropertyModal({ isOpen, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    price: '',
    type: 'house',
    status: 'available',
    beds: '',
    baths: '',
    sqft: '',
    image_url: '',
    description: ''
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Sincronización con las columnas de la tabla inventory
      const { error } = await supabase
        .from('inventory')
        .insert([{
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price) || 0,
          type: formData.type,
          status: formData.status,
          image_url: formData.image_url || null,
          location: formData.location,
          beds: parseInt(formData.beds) || 0,
          baths: parseInt(formData.baths) || 0,
          sqft: parseInt(formData.sqft) || 0
        }]);

      if (error) throw error;
      
      onSuccess();
      onClose();
      
      // Resetear formulario
      setFormData({
        title: '',
        location: '',
        price: '',
        type: 'house',
        status: 'available',
        beds: '',
        baths: '',
        sqft: '',
        image_url: '',
        description: ''
      });
    } catch (error: any) {
      console.error('Error creating property:', error);
      alert('Error al crear la propiedad: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        
        {/* Cabecera */}
        <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Home size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-slate-900">Nueva Propiedad</h2>
              <p className="text-sm text-slate-500 font-medium">Completa los datos técnicos del activo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-2xl transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Columna Izquierda: Identificación y Ubicación */}
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título del Anuncio</label>
                <input
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ej: Villa Lujosa con Vistas"
                  className="w-full mt-2 px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ubicación</label>
                <div className="relative mt-2">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    name="location"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Ciudad, Zona o Calle"
                    className="w-full pl-14 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Precio (€)</label>
                  <div className="relative mt-2">
                    <Euro className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      name="price"
                      type="number"
                      required
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="w-full pl-14 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full mt-2 px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold appearance-none cursor-pointer"
                  >
                    <option value="house">Casa</option>
                    <option value="apartment">Apartamento</option>
                    <option value="land">Terreno</option>
                    <option value="commercial">Comercial</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Características */}
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hab.</label>
                  <div className="relative mt-2">
                    <BedDouble className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      name="beds"
                      type="number"
                      value={formData.beds}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold text-center"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Baños</label>
                  <div className="relative mt-2">
                    <Bath className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      name="baths"
                      type="number"
                      value={formData.baths}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold text-center"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">m²</label>
                  <div className="relative mt-2">
                    <Square className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      name="sqft"
                      type="number"
                      value={formData.sqft}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold text-center"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL Imagen</label>
                <div className="relative mt-2">
                  <ImageIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="w-full pl-14 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium transition-all text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción</label>
                <textarea
                  name="description"
                  rows={2}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Detalles adicionales..."
                  className="w-full mt-2 px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium transition-all resize-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-10 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 transition-all flex items-center gap-3 disabled:opacity-50 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Publicar Propiedad
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}