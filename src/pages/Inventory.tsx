import React, { useState } from 'react';
import { AppNotification } from '../components/AppNotification'; // Importas el componente

export function Inventory() {
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
    // Aquí simulamos una acción de guardado
    setNotification({
      show: true,
      title: "ACTUALIZACIÓN EXITOSA",
      message: "El stock de la propiedad ha sido actualizado correctamente.",
      type: 'success'
    });
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Inventario</h1>
      
      <button 
        onClick={handleAction}
        className="bg-pine-600 text-white px-4 py-2 rounded-xl"
      >
        Guardar Cambios
      </button>

      {/* EL COMPONENTE SE PONE AQUÍ AL FINAL */}
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