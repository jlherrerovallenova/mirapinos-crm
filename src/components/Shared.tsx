// src/components/Shared.tsx
import React from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

// --- Componentes Existentes ---

export function StatCard({ title, value, subtext, total, color }: any) {
  return (
    <div className="bg-white p-8 rounded-4xl shadow-sm border border-pine-100 hover:shadow-xl hover:shadow-pine-900/5 transition-all duration-500 group overflow-hidden relative">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-pine-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
      
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4 border-l-4 border-pine-600 pl-4 transition-all group-hover:pl-6">
        {title}
      </p>
      
      <div className="flex items-baseline gap-2 relative z-10">
        <span className={`text-5xl font-poppins font-bold tracking-tighter ${color || 'text-pine-900'}`}>
          {value}
        </span>
        {total && <span className="text-lg text-slate-300 font-bold">/ {total}</span>}
      </div>
      
      {subtext && (
        <div className="mt-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-pine-600 rounded-full animate-pulse"></span>
          <p className="text-xs text-pine-600 font-bold uppercase tracking-tighter">{subtext}</p>
        </div>
      )}
    </div>
  );
}

export function StageBadge({ stage }: { stage: string }) {
  const colors: any = {
     'Prospecto': 'bg-slate-100 text-slate-500',
     'Visitando': 'bg-emerald-50 text-emerald-600 border border-emerald-100',
     'Interés': 'bg-amber-50 text-amber-600 border border-amber-100',
     'Cierre': 'bg-pine-900 text-white shadow-md shadow-pine-900/20'
  };
  return (
     <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${colors[stage] || 'bg-gray-100'}`}>
        {stage}
     </span>
  );
}

// --- Nuevo Componente de Notificación ---

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
    success: {
      icon: <CheckCircle2 className="text-emerald-500" size={24} />,
      bg: 'bg-emerald-50/90',
      border: 'border-emerald-100',
      accent: 'bg-emerald-500',
    },
    error: {
      icon: <AlertCircle className="text-rose-500" size={24} />,
      bg: 'bg-rose-50/90',
      border: 'border-rose-100',
      accent: 'bg-rose-500',
    },
    info: {
      icon: <Info className="text-pine-500" size={24} />,
      bg: 'bg-white/95',
      border: 'border-pine-100',
      accent: 'bg-pine-500',
    },
  };

  const theme = themes[type];

  return (
    <div className={`
      fixed bottom-6 right-6 z-[100]
      w-full max-w-sm overflow-hidden
      ${theme.bg} backdrop-blur-md border ${theme.border}
      rounded-3xl shadow-2xl shadow-pine-900/10
      animate-in slide-in-from-right-10 duration-500
    `}>
      <div className={`h-1 w-full ${theme.accent} opacity-40`} />
      
      <div className="p-5 flex items-start gap-4">
        <div className="flex-shrink-0 mt-0.5">
          {theme.icon}
        </div>
        
        <div className="flex-1">
          <h4 className="text-sm font-black text-pine-900 font-poppins tracking-tight uppercase">
            {title}
          </h4>
          <p className="text-xs text-pine-700/80 font-lato mt-1 leading-relaxed">
            {message}
          </p>
        </div>

        <button 
          onClick={onClose}
          className="p-1 hover:bg-pine-100/50 rounded-full transition-colors text-pine-400"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};