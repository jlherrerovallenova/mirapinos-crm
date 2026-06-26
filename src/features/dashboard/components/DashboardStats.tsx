import { useNavigate } from 'react-router-dom';
import {
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Smartphone,
  Phone,
  HelpCircle
} from 'lucide-react';

interface SourceStat {
  name: string;
  count: number;
  percentage: number;
}

interface DashboardStatsProps {
  loading: boolean;
  stats: {
    totalLeads: number;
    topSources: SourceStat[];
  };
}

export default function DashboardStats({ loading, stats }: DashboardStatsProps) {
  const navigate = useNavigate();

  const getSourceIcon = (sourceName: string) => {
    const lower = sourceName.toLowerCase();
    if (lower.includes('idealista')) return <img src="/idealista.png" alt="Idealista" className="w-4 h-4 object-contain rounded" />;
    if (lower.includes('web') || lower.includes('google')) return <Globe className="text-blue-600" size={16} />;
    if (lower.includes('insta') || lower.includes('facebook') || lower.includes('redes')) return <Smartphone className="text-purple-600" size={16} />;
    if (lower.includes('referido') || lower.includes('amigo')) return <Users className="text-emerald-600" size={16} />;
    if (lower.includes('llamada')) return <Phone className="text-amber-600" size={16} />;
    return <HelpCircle className="text-slate-400" size={16} />;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Contactos"
        value={stats.totalLeads.toString()}
        change="Base de Datos"
        isPositive={true}
        icon={<Users className="text-slate-900" size={16} />}
        trendIcon={false}
        onClick={() => navigate('/leads')}
      />
      {stats.topSources.map((source, index) => (
        <StatCard
          key={index}
          title={`Origen: ${source.name}`}
          value={source.count.toString()}
          change={`${source.percentage}%`}
          isPositive={true}
          icon={getSourceIcon(source.name)}
          trendIcon={true}
          onClick={() => navigate(`/leads?source=${encodeURIComponent(source.name)}`)}
        />
      ))}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
  trendIcon?: boolean;
  onClick?: () => void;
}

function StatCard({ title, value, change, isPositive, icon, trendIcon = true, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 transition-all duration-200 flex flex-col justify-between ${onClick ? 'cursor-pointer hover:shadow-md hover:border-emerald-200 hover:-translate-y-0.5' : ''
        }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="p-1.5 bg-slate-50 rounded-lg">{icon}</div>
        {trendIcon && (
          <div className={`flex items-center text-[10px] font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            <span className="ml-1">{change}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-slate-500 text-xs font-medium">{title}</p>
        <h4 className="text-xl font-bold text-slate-900 mt-0.5">{value}</h4>
      </div>
    </div>
  );
}
