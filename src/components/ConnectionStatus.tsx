import { useEffect, useState } from 'react';
import { Wifi, WifiOff, DatabaseZap } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const ConnectionStatus = () => {
  const [isNetworkOnline, setIsNetworkOnline] = useState(true);
  const [isDbConnected, setIsDbConnected] = useState(true);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    // 1. Monitorización de red a nivel de hardware (Navegador)
    const handleOnline = () => {
      setIsNetworkOnline(true);
      setShowAlert(false);
    };

    const handleOffline = () => {
      setIsNetworkOnline(false);
      setShowAlert(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsNetworkOnline(navigator.onLine);

    // 2. Monitorización de la conexión real con Supabase mediante un canal
    const healthChannel = supabase.channel('system_health_monitor');
    
    healthChannel
      .on('system', { event: '*' }, (payload) => {
        console.log('Estado de Supabase Realtime:', payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsDbConnected(true);
          setShowAlert(false);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsDbConnected(false);
          setShowAlert(true);
        }
      });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      supabase.removeChannel(healthChannel);
    };
  }, []);

  const isFullyConnected = isNetworkOnline && isDbConnected;

  if (isFullyConnected && !showAlert) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] transition-all duration-300">
      <div className={`w-full py-3 px-4 flex items-center justify-center gap-3 text-sm font-medium ${
        isFullyConnected
          ? 'bg-emerald-50 text-emerald-700 border-b border-emerald-100'
          : 'bg-rose-50 text-rose-700 border-b border-rose-100'
      }`}>
        {isFullyConnected ? (
          <>
            <Wifi size={16} />
            Conexión restaurada
          </>
        ) : !isNetworkOnline ? (
          <>
            <WifiOff size={16} />
            Conexión de red perdida. Revisando internet...
          </>
        ) : (
          <>
            <DatabaseZap size={16} />
            Desconectado de la base de datos. Intentando reconectar...
          </>
        )}
      </div>
    </div>
  );
};