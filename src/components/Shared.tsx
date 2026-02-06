// src/components/Shared.tsx
import React from 'react';

export function StatCard({ title, value, subtext, total, color }: any) {
  return (
    <div className="bg-white p-8 rounded-4xl shadow-sm border border-pine-100 hover:shadow-xl hover:shadow-pine-900/5 transition-all duration-500 group overflow-hidden relative">
      {/* Decoración de fondo sutil */}
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