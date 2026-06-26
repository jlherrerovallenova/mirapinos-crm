import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Plus } from 'lucide-react';

interface RecentLead {
  id: string;
  name: string;
  source: string | null;
  created_at: string;
}

interface DashboardNoActivityProps {
  noActivityLeads: RecentLead[];
  searchQuery: string;
  loading: boolean;
}

export default function DashboardNoActivity({ noActivityLeads, searchQuery, loading }: DashboardNoActivityProps) {
  const navigate = useNavigate();

  const filtered = noActivityLeads.filter(l =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filtered.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 animate-in fade-in">
        <CheckCircle2 size={48} className="mb-4 opacity-30 text-emerald-500" />
        <p className="text-sm font-medium text-slate-600">¡Increíble!</p>
        <p className="text-xs opacity-60">Todos tus clientes tienen acciones programadas.</p>
      </div>
    );
  }

  return (
    <>
      {filtered.map((lead) => (
        <div
          key={lead.id}
          className="p-4 hover:bg-slate-50 transition-all flex items-center justify-between group bg-white cursor-pointer"
          onClick={() => navigate(`/leads?open=${lead.id}`)}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-orange-50 text-orange-600 border border-orange-100 font-bold text-xs">
              {lead.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-slate-800">{lead.name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-medium">{lead.source || 'Sin origen'}</span>
                <span>•</span>
                <span className="text-red-400 font-medium">Sin actividad registrada</span>
              </div>
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Plus size={18} className="text-emerald-500" />
          </div>
        </div>
      ))}
    </>
  );
}
