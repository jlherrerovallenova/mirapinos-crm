import React from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

// 1. Tarjeta de Estadísticas (Nuevo Diseño "Boxed")
export function StatCard({ title, value, subtext, icon, type = 'neutral' }: any) {
  // Mapeo de colores para la barra inferior
  const colors = {
    primary: 'bg-blue-500',
    warning: 'bg-amber-500',
    success: 'bg-emerald-500',
    neutral: 'bg-slate-400',
    error: 'bg-rose-500'
  };
  
  const activeColor = colors[type as keyof typeof colors] || colors.neutral;

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group hover:border-slate-300 transition-all">
      <div className="flex justify-between items-start z-10">
        <div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
        </div>
        <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
            {icon}
        </div>
      </div>
      <div className="mt-auto z-10">
        <p className="text-xs font-medium text-slate-400 truncate">
          {subtext}
        </p>
      </div>
      {/* Barra de color decorativa */}
      <div className={`absolute bottom-0 left-0 w-full h-1 ${activeColor}`}></div>
    </div>
  );
}

// 2. Badge de Estado (Actualizado para High Contrast)
export function StageBadge({ stage }: { stage: string }) {
  const styles: any = {
     'Prospecto': 'bg-slate-100 text-slate-600 border-slate-200',
     'Visitando': 'bg-blue-50 text-blue-700 border-blue-200',
     'Interés': 'bg-amber-50 text-amber-700 border-amber-200',
     'Cierre': 'bg-emerald-50 text-emerald-700 border-emerald-200',
     // Fallback
     'default': 'bg-slate-50 text-slate-600 border-slate-200'
  };

  const activeStyle = styles[stage] || styles.default;

  return (
     <span className={`px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wide ${activeStyle}`}>
        {stage}
     </span>
  );
}

// 3. Notificaciones (Actualizado estilo sólido)
interface AppNotificationProps {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export const AppNotification: React.FC<AppNotificationProps> = ({
  title,
  message,
  type = 'success',
  onClose,
  duration = 5000,
}) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const themes = {
    success: { icon: <CheckCircle2 size={20} />, style: 'bg-emerald-600 text-white' },
    error: { icon: <AlertCircle size={20} />, style: 'bg-rose-600 text-white' },
    info: { icon: <Info size={20} />, style: 'bg-slate-800 text-white' },
  };

  const theme = themes[type];

  return (
    <div className={`
      fixed bottom-6 right-6 z-[100]
      w-full max-w-sm overflow-hidden
      ${theme.style} rounded-lg shadow-lg shadow-slate-900/20
      animate-in slide-in-from-right-10 duration-300
      flex items-start p-4 gap-3
    `}>
      <div className="mt-0.5">{theme.icon}</div>
      <div className="flex-1">
        <h4 className="text-sm font-bold uppercase tracking-wide">{title}</h4>
        <p className="text-sm opacity-90 leading-snug mt-1">{message}</p>
      </div>
      <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity">
        <X size={16} />
      </button>
    </div>
  );
};