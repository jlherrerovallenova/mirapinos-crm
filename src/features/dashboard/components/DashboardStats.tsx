import { useNavigate } from 'react-router-dom';
import {
  Users,
  ArrowUpRight,
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
    if (lower.includes('web') || lower.includes('google')) return <Globe size={16} />;
    if (lower.includes('insta') || lower.includes('facebook') || lower.includes('redes')) return <Smartphone size={16} />;
    if (lower.includes('referido') || lower.includes('amigo')) return <Users size={16} />;
    if (lower.includes('llamada')) return <Phone size={16} />;
    return <HelpCircle size={16} />;
  };

  const getCardClasses = (sourceName: string) => {
    const lower = sourceName.toLowerCase();
    if (lower.includes('idealista')) {
      return { bg: 'bg-[#85f8c4]/40', text: 'text-[#002114]' }; // soft emerald
    }
    if (lower.includes('web') || lower.includes('google')) {
      return { bg: 'bg-[#e1e0ff]', text: 'text-[#07006c]' }; // soft blue-indigo
    }
    return { bg: 'bg-[#e0e3e5]', text: 'text-[#45464d]' }; // soft gray
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  // Asegurar que tengamos al menos 3 fuentes, o rellenar
  const topSources = [...stats.topSources];
  while (topSources.length < 3) {
    topSources.push({ name: 'Otros', count: 0, percentage: 0 });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Contactos"
        value={stats.totalLeads.toString()}
        change="Base de Datos"
        trendIcon={false}
        icon={<Users size={16} />}
        bgIconClass="bg-[#dae2fd]"
        textIconClass="text-[#131b2e]"
        onClick={() => navigate('/leads')}
      />
      {topSources.slice(0, 3).map((source, index) => {
        const classes = getCardClasses(source.name);
        return (
          <StatCard
            key={index}
            title={`Origen: ${source.name}`}
            value={source.count.toString()}
            change={`${source.percentage}%`}
            trendIcon={true}
            icon={getSourceIcon(source.name)}
            bgIconClass={classes.bg}
            textIconClass={classes.text}
            onClick={() => navigate(`/leads?source=${encodeURIComponent(source.name)}`)}
          />
        );
      })}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  bgIconClass: string;
  textIconClass: string;
  trendIcon?: boolean;
  onClick?: () => void;
}

function StatCard({
  title,
  value,
  change,
  icon,
  bgIconClass,
  textIconClass,
  trendIcon = true,
  onClick
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white p-6 rounded-xl border border-slate-200 transition-all duration-300 flex flex-col justify-between shadow-[0_4px_6px_-1px_rgb(0,0,0,0.05)] hover:shadow-lg ${onClick ? 'cursor-pointer hover:border-emerald-500/30 hover:-translate-y-0.5' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg ${bgIconClass} ${textIconClass} flex items-center justify-center`}>
          {icon}
        </div>
        {trendIcon ? (
          <div className="flex items-center text-xs font-bold text-[#006c4a]">
            <ArrowUpRight size={14} className="mr-0.5 text-emerald-600" />
            {change}
          </div>
        ) : (
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</span>
        )}
      </div>
      <div className="flex flex-col">
        <p className="text-slate-500 text-xs font-medium">{title}</p>
        <h4 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{value}</h4>
      </div>
    </div>
  );
}
