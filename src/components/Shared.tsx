// src/components/Shared.tsx
import React from 'react';

export function StatCard({ title, value, subtext, total, color }: any) {
  return (
    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 hover:shadow-2xl hover:scale-[1.02] transition-all group">
       <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mb-4 border-l-4 border-slate-100 pl-4 group-hover:border-emerald-500 transition-all">{title}</p>
       <div className="flex items-baseline gap-2">
          <span className={`text-5xl font-black tracking-tighter ${color}`}>{value}</span>
          {total && <span className="text-base text-slate-300 font-bold">/ {total}</span>}
       </div>
       {subtext && <p className="text-[10px] text-slate-400 font-bold mt-3 uppercase tracking-tighter opacity-70">{subtext}</p>}
    </div>
  );
}

export function StageBadge({ stage }: { stage: string }) {
  const colors: any = {
     'Prospecto': 'bg-slate-100 text-slate-500',
     'Visitando': 'bg-blue-100 text-blue-700',
     'Interés': 'bg-amber-100 text-amber-700',
     'Cierre': 'bg-emerald-100 text-emerald-700'
  };
  return (
     <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${colors[stage] || 'bg-gray-100'}`}>
        {stage}
     </span>
  );
}