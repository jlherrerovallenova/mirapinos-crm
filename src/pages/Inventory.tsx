// src/pages/Inventory.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Inventory() {
  const [inventory, setInventory] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('inventory').select('*').order('id').then(({ data }) => {
       if (data && data.length > 0) setInventory(data);
       else {
          // Fallback generator if empty
          const dummy = [];
          for (let i = 1; i <= 13; i++) dummy.push({ id: i, number: `${i}`, type: 'OLIVO', status: 'available' });
          setInventory(dummy);
       }
    });
  }, []);

  const types = ['OLIVO', 'ARCE', 'PARCELA'];

  return (
    <div className="p-8 overflow-auto animate-in fade-in">
       <h2 className="text-xl font-semibold text-slate-700 uppercase tracking-widest text-sm mb-8">Inventario de Promoción</h2>
       
       <div className="space-y-12">
          {types.map(type => (
             <section key={type}>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-4">
                   Modelo {type}
                   <div className="h-[1px] flex-1 bg-slate-200"></div>
                </h3>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-4">
                   {inventory.filter(u => u.type === type).map(unit => (
                      <div key={unit.id} className={`aspect-square rounded-2xl flex flex-col items-center justify-center border-2 transition-all font-bold ${
                         unit.status === 'available' ? 'bg-white border-emerald-100 text-emerald-600 hover:scale-105 hover:shadow-lg' :
                         unit.status === 'reserved' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                         'bg-slate-50 border-slate-100 text-slate-300'
                      }`}>
                         <span className="text-[10px] uppercase opacity-50 mb-1">{unit.type[0]}</span>
                         {unit.number}
                      </div>
                   ))}
                </div>
             </section>
          ))}
       </div>
    </div>
  );
}