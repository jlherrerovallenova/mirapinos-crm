import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { StatCard } from '../components/Shared';
import { TrendingUp, Users, Home, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState({ leads: 0, reserved: 0, sold: 0, total: 46 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { count: l } = await supabase.from('leads').select('*', { count: 'exact', head: true });
      const { data: inv } = await supabase.from('inventory').select('status');
      
      if (inv) {
        setData({
          leads: l || 0,
          reserved: inv.filter(i => i.status === 'reserved').length,
          sold: inv.filter(i => i.status === 'sold').length,
          total: inv.length || 46
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="animate-pulse p-10">Sincronizando...</div>;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header>
        <h2 className="text-4xl font-poppins font-bold text-pine-900 tracking-tight">Resumen Ejecutivo</h2>
        <p className="text-slate-400 mt-2 font-medium">Estado actual de la promoción Mirapinos</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title="Disponibilidad" value={data.total - data.sold - data.reserved} total={data.total} subtext="Unidades libres" color="text-pine-600" />
        <StatCard title="Reservas" value={data.reserved} subtext="En proceso" color="text-amber-500" />
        <StatCard title="Ventas" value={data.sold} subtext="Cerradas" color="text-emerald-800" />
        <StatCard title="Leads" value={data.leads} subtext="Interesados" color="text-slate-800" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-4xl p-10 shadow-sm border border-pine-100">
           <div className="flex justify-between items-center mb-10">
              <h3 className="font-poppins font-bold text-xl text-pine-900">Rendimiento Comercial</h3>
              <TrendingUp className="text-pine-600" />
           </div>
           {/* Aquí podrías integrar un gráfico de Recharts con tonos verdes */}
           <div className="h-64 bg-pine-50/50 rounded-3xl border-2 border-dashed border-pine-100 flex items-center justify-center">
              <p className="text-pine-600 text-sm font-bold uppercase tracking-widest italic">Visualización Dinámica</p>
           </div>
        </div>
        
        <div className="bg-pine-900 rounded-4xl p-10 text-white shadow-2xl shadow-pine-900/30 flex flex-col justify-between">
           <div>
              <h3 className="font-poppins font-bold text-xl mb-4">Próximo Hito</h3>
              <p className="text-pine-100/70 text-sm leading-relaxed">Alcanzar el 75% de las ventas proyectadas para el Q1.</p>
           </div>
           <div className="mt-8">
              <div className="flex justify-between text-xs font-bold mb-2">
                 <span>PROGRESO</span>
                 <span>68%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                 <div className="h-full bg-pine-600 w-[68%] rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}