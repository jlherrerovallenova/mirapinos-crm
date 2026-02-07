// src/pages/Inventory.tsx
import React, { useState } from 'react';
import { AppNotification } from '../components/Shared'; // Ruta corregida
import { Plus, Search, Building2, MapPin, Tag } from 'lucide-react';

export default function Inventory() {
  const [notification, setNotification] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    title: '',
    message: '',
    type: 'success'
  });

  const handleAction = () => {
    setNotification({
      show: true,
      title: "INVENTARIO ACTUALIZADO",
      message: "Los datos de la propiedad han sido guardados correctamente.",
      type: 'success'
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <header className="flex justify-between items-center">
        <div>
          <p className="text-pine-600 font-bold uppercase tracking-[0.3em] text-[10px] mb-2">Activos</p>
          <h1 className="text-4xl font-poppins font-bold text-slate-900 tracking-tight">Inventario</h1>
        </div>
        <button 
          onClick={handleAction}
          className="px-8 py-4 bg-pine-900 text-white font-bold rounded-2xl shadow-lg hover:bg-pine-800 transition-all text-sm flex items-center gap-2"
        >
          <Plus size={20} /> AÑADIR PROPIEDAD
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Ejemplo de tarjeta de inventario */}
        <div className="bg-white rounded-4xl border border-pine-100 p-6 shadow-sm hover:shadow-xl transition-all group">
          <div className="h-48 bg-pine-50 rounded-3xl mb-6 flex items-center justify-center text-pine-200">
            <Building2 size={48} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">Villa Nova Residences</h3>
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
            <MapPin size={14} />
            <span>Zona Norte, Sector A</span>
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-pine-50">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-pine-600" />
              <span className="text-lg font-bold text-pine-900">$450,000</span>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-lg">Disponible</span>
          </div>
        </div>
      </div>

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