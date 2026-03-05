import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowAlert(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowAlert(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showAlert) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] transition-all duration-300">
      <div className={`w-full py-3 px-4 flex items-center justify-center gap-3 text-sm font-medium ${
        isOnline
          ? 'bg-emerald-50 text-emerald-700 border-b border-emerald-100'
          : 'bg-rose-50 text-rose-700 border-b border-rose-100'
      }`}>
        {isOnline ? (
          <>
            <Wifi size={16} />
            Conexión restaurada
          </>
        ) : (
          <>
            <WifiOff size={16} />
            Conexión perdida. Intentando reconectar...
          </>
        )}
      </div>
    </div>
  );
};
