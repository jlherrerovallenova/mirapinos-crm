// src/pages/Dashboard.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { StatCard } from '../components/Shared';
import { Clock } from 'lucide-react';

export default function Dashboard() {
  const [leadsCount, setLeadsCount] = useState(0);
  const [events, setEvents] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true });
      const { data: e } = await supabase.from('events').select('*').order('date', { ascending: false }).limit(5);
      const { data: i } = await supabase.from('inventory').select('*');
      
      if (count !== null) setLeadsCount(count);
      if (e) setEvents(e);
      if (i) setInventory(i);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="p-8">Cargando datos...</div>;

  const sold = inventory.filter(i => i.status === 'sold').length;
  const reserved = inventory.filter(i => i.status === 'reserved').length;
  const available = (inventory.length || 46) - sold - reserved;

  return (
    <div className="p-8 overflow-auto h-full space-y-8 animate-in fade-in">
      <h2 className="text-xl font-semibold text-slate-700 uppercase tracking-widest text-sm mb-6">Panel Principal</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Viviendas Disponibles" value={available} total={inventory.length || 46} color="text-emerald-600" />
        <StatCard title="Reservas Activas" value={reserved} subtext="En proceso de firma" color="text-amber-500" />
        <StatCard title="Ventas Cerradas" value={sold} subtext="Contratos firmados" color="text-blue-600" />
        <StatCard title="Clientes Totales" value={leadsCount} color="text-slate-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
           <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-8 border-b border-slate-50 pb-4">Actividad Reciente</h3>
           <div className="space-y-4">
            {events.map(event => (
              <div key={event.id} className="flex gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100 group">
                <div className="text-slate-300 mt-1 group-hover:text-emerald-500"><Clock size={18}/></div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{event.type}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{event.description}</p>
                  <p className="text-[9px] text-slate-300 font-black mt-2 uppercase tracking-widest">{new Date(event.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
           </div>
        </div>
      </div>
    </div>
  );
}