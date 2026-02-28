// src/components/inventory/CreatePropertyModal.tsx
import React, { useState } from 'react';
import {
  X,
  Home,
  Hash,
  Maximize,
  Ruler,
  BedDouble,
  Bath,
  Euro,
  Loader2,
  Save
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useDialog } from '../../context/DialogContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: any;
}

export default function CreatePropertyModal({ isOpen, onClose, onSuccess, initialData }: Props) {
  const [loading, setLoading] = useState(false);
  const { showAlert } = useDialog();
  const [formData, setFormData] = useState({
    modelo: initialData?.modelo || '1. OLIVO',
    numero_vivienda: initialData?.numero_vivienda || '',
    superficie_parcela: initialData?.superficie_parcela || '',
    superficie_util: initialData?.superficie_util || '',
    superficie_construida: initialData?.superficie_construida || '',
    habitaciones: initialData?.habitaciones?.toString() || '',
    banos: initialData?.banos?.toString() || '',
    precio: initialData?.precio?.toString() || ''
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Sincronización con las nuevas columnas de la tabla inventory
      const { error } = await (supabase as any)
        .from('inventory')
        .insert([{
          modelo: formData.modelo,
          numero_vivienda: formData.numero_vivienda,
          superficie_parcela: parseFloat(formData.superficie_parcela) || 0,
          superficie_util: parseFloat(formData.superficie_util) || 0,
          superficie_construida: parseFloat(formData.superficie_construida) || 0,
          habitaciones: parseInt(formData.habitaciones) || 0,
          banos: parseInt(formData.banos) || 0,
          precio: parseFloat(formData.precio) || 0
        }]);

      if (error) throw error;

      onSuccess?.();
      onClose();

      // Resetear formulario
      setFormData({
        modelo: '1. OLIVO',
        numero_vivienda: '',
        superficie_parcela: '',
        superficie_util: '',
        superficie_construida: '',
        habitaciones: '',
        banos: '',
        precio: ''
      });
    } catch (error: any) {
      console.error('Error creating property:', error);
      await showAlert({ title: 'Error', message: 'Error al crear la propiedad: ' + (error.message || 'Error desconocido') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* 1. MODELO */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modelo</label>
              <div className="relative mt-2">
                <Home className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select
                  name="modelo"
                  value={formData.modelo}
                  onChange={handleChange}
                  className="w-full pl-14 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold appearance-none cursor-pointer text-slate-700"
                >
                  <option value="1. OLIVO">1. OLIVO</option>
                  <option value="2. ARCE">2. ARCE</option>
                </select>
              </div>
            </div>

            {/* 2. Nº DE VIVIENDA */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nº de Vivienda</label>
              <div className="relative mt-2">
                <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  name="numero_vivienda"
                  required
                  value={formData.numero_vivienda}
                  onChange={handleChange}
                  placeholder="Ej: 14A"
                  className="w-full pl-14 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium transition-all"
                />
              </div>
            </div>

            {/* 3. SUPERFICIE PARCELA */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Superficie Parcela (m²)</label>
              <div className="relative mt-2">
                <Maximize className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  name="superficie_parcela"
                  type="number"
                  required
                  value={formData.superficie_parcela}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full pl-14 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold transition-all"
                />
              </div>
            </div>

            {/* 4. SUPERFICIE UTIL */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Superficie Útil (m²)</label>
              <div className="relative mt-2">
                <Ruler className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  name="superficie_util"
                  type="number"
                  required
                  value={formData.superficie_util}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full pl-14 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold transition-all"
                />
              </div>
            </div>

            {/* 5. SUPERFICIE CONSTRUIDA */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Superficie Construida (m²)</label>
              <div className="relative mt-2">
                <Ruler className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  name="superficie_construida"
                  type="number"
                  required
                  value={formData.superficie_construida}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full pl-14 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold transition-all"
                />
              </div>
            </div>

            {/* 6. HABITACIONES */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Habitaciones</label>
              <div className="relative mt-2">
                <BedDouble className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  name="habitaciones"
                  type="number"
                  required
                  value={formData.habitaciones}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full pl-14 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold transition-all"
                />
              </div>
            </div>

            {/* 7. BAÑOS */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Baños</label>
              <div className="relative mt-2">
                <Bath className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  name="banos"
                  type="number"
                  required
                  value={formData.banos}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full pl-14 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold transition-all"
                />
              </div>
            </div>

            {/* 8. PRECIO */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Precio (€)</label>
              <div className="relative mt-2">
                <Euro className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  name="precio"
                  type="number"
                  required
                  value={formData.precio}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full pl-14 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold transition-all"
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
              Guardar Propiedad
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}