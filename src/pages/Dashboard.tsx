// src/pages/Dashboard.tsx
import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { session } = useAuth(); //
  
  // Estado local para manejar las actividades de la agenda
  const [activities, setActivities] = useState([
    { id: 1, type: 'Llamada', contact: 'Juan Pérez', time: '10:30 AM', status: 'pending', priority: 'high' },
    { id: 2, type: 'Visita', contact: 'María García', time: '12:00 PM', status: 'completed', priority: 'medium' },
    { id: 3, type: 'Email', contact: 'Roberto Carlos', time: '04:15 PM', status: 'pending', priority: 'low' },
  ]);

  // Función para editar una acción
  const handleEdit = (id: number) => {
    console.log("Editando actividad:", id);
    // Aquí se integraría la lógica para abrir un formulario de edición
  };

  // Función para borrar una acción con confirmación
  const handleDelete = (id: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta acción?")) {
      setActivities(activities.filter(act => act.id !== id));
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER DE BIENVENIDA */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          ¡Hola de nuevo, {session?.user.email?.split('@')[0]}!
        </h1>
        <p className="text-slate-500">Aquí tienes el resumen de tu actividad para hoy.</p>
      </div>

      {/* TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Leads Totales" 
          value="128" 
          change="+12%" 
          isPositive={true} 
          icon={<Users className="text-emerald-600" size={20} />} 
        />
        <StatCard 
          title="Citas Hoy" 
          value="5" 
          change="0%" 
          isPositive={true} 
          icon={<Calendar className="text-blue-600" size={20} />} 
        />
        <StatCard 
          title="Tasa Conversión" 
          value="24%" 
          change="+3%" 
          isPositive={true} 
          icon={<TrendingUp className="text-purple-600" size={20} />} 
        />
        <StatCard 
          title="Leads Fríos" 
          value="12" 
          change="-5%" 
          isPositive={false} 
          icon={<AlertCircle className="text-amber-600" size={20} />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AGENDA DE ACTIVIDADES */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Clock size={18} className="text-emerald-500" />
              Agenda de Actividades
            </h3>
            <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
              VER TODAS
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {activities.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {activity.status === 'completed' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{activity.type}: {activity.contact}</p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    activity.priority === 'high' ? 'bg-red-100 text-red-600' : 
                    activity.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {activity.priority}
                  </span>
                  
                  {/* BOTONES DE ACCIÓN: Aparecen al hacer hover sobre la fila */}
                  <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(activity.id)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Editar acción"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(activity.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Borrar acción"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ÚLTIMOS LEADS */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Leads Recientes</h3>
          </div>
          <div className="p-6 space-y-6">
            <RecentLead name="Ana Martínez" source="Instagram" time="hace 10 min" />
            <RecentLead name="Carlos Ruiz" source="Web" time="hace 45 min" />
            <RecentLead name="Elena Soler" source="Referido" time="hace 2 horas" />
            <button className="w-full py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
              Gestionar todos los leads
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componentes auxiliares internos
function StatCard({ title, value, change, isPositive, icon }: { 
  title: string, value: string, change: string, isPositive: boolean, icon: React.ReactNode 
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        <div className={`flex items-center text-xs font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change}
        </div>
      </div>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <h4 className="text-2xl font-bold text-slate-900 mt-1">{value}</h4>
    </div>
  );
}

function RecentLead({ name, source, time }: { name: string, source: string, time: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
          {name.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">{name}</p>
          <p className="text-xs text-slate-500">{source}</p>
        </div>
      </div>
      <span className="text-[10px] text-slate-400 font-medium">{time}</span>
    </div>
  );
}