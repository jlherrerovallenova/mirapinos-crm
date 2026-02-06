// src/pages/Inventory.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function Inventory() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    setLoading(true);
    const { data } = await supabase.from('inventory').select('*').order('id');
    if (data && data.length > 0) {
      setInventory(data);
    } else {
      // Dummy data si no hay nada en DB
      const dummy = [];
      const types = ['OLIVO', 'ARCE', 'PARCELA'];
      for (let i = 1; i <= 30; i++) {
        dummy.push({ 
          id: i, 
          number: `${i}`, 
          type: types[Math.floor(Math.random() * types.length)], 
          status: 'available' 
        });
      }
      setInventory(dummy);
    }
    setLoading(false);
  }

  const toggleStatus = async (unit: any) => {
    const newStatus = unit.status === 'available' ? 'reserved' : 'available';
    
    // UI Update
    setInventory(prev => prev.map(u => u.id === unit.id ? { ...u, status: newStatus } : u));
    
    // DB Update
    await supabase.from('inventory').update({ status: newStatus }).eq('id', unit.id);
  };

  const types = ['OLIVO', 'ARCE', 'PARCELA'];

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

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
                      <div 
                        key={unit.id} 
                        onClick={() => toggleStatus(unit)}
                        className={`aspect-square rounded-2xl flex flex-col items-center justify-center border-2 transition-all font-bold cursor-pointer ${
                         unit.status === 'available' ? 'bg-white border-emerald-100 text-emerald-600 hover:scale-105 hover:shadow-lg' :
                         unit.status === 'reserved' ? 'bg-amber-50 border-amber-100 text-amber-600 hover:bg-amber-100' :
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