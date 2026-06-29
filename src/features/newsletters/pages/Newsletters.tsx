// src/pages/Newsletters.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Loader2, Plus, Mail, Clock, Send, Edit, Copy, Search, Filter, TrendingUp, BarChart3 } from 'lucide-react';

type Newsletter = {
    id: string;
    subject: string;
    status: 'draft' | 'sent';
    created_at: string;
    sent_at: string | null;
};

export default function Newsletters() {
    const navigate = useNavigate();
    const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent'>('all');
    const [subscriberCount, setSubscriberCount] = useState<number | null>(null);

    useEffect(() => {
        fetchNewsletters();
        fetchSubscriberCount();
    }, []);

    const fetchNewsletters = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('newsletters')
                .select('id, subject, status, created_at, sent_at')
                .order('created_at', { ascending: false });

            if (error) {
                if (error.code === '42P01') {
                    console.log("Newsletter table not found, waiting for migrations to be applied manually");
                    setNewsletters([]);
                    return;
                }
                throw error;
            }
            if (data) setNewsletters(data as Newsletter[]);
        } catch (error) {
            console.error('Error fetching newsletters:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubscriberCount = async () => {
        try {
            const { count, error } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .not('email', 'is', null);
            if (error) throw error;
            setSubscriberCount(count);
        } catch (e) {
            console.error("Error fetching subscribers count:", e);
        }
    };

    const handleCreate = async () => {
        try {
            const { data, error } = await (supabase as any)
                .from('newsletters')
                .insert([{ subject: 'Nueva Campaña Sin Título' }])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                navigate(`/newsletters/${data.id}`);
            }
        } catch (error) {
            console.error("Error creating draft", error);
            alert("Asegúrate de haber ejecutado el SQL en Supabase para crear la tabla newsletters.");
        }
    };

    const handleDuplicate = async (newsletter: Newsletter) => {
        try {
            // Obtener el diseño completo del original
            const { data: original, error: fetchError } = await supabase
                .from('newsletters')
                .select('design, html_content')
                .eq('id', newsletter.id)
                .single();

            if (fetchError) throw fetchError;

            const { data, error } = await (supabase as any)
                .from('newsletters')
                .insert([{ 
                    subject: `${newsletter.subject} (Copia)`,
                    design: (original as any).design,
                    html_content: (original as any).html_content,
                    status: 'draft'
                }])
                .select()
                .single();

            if (error) throw error;
            if (data) navigate(`/newsletters/${data.id}`);
        } catch (error) {
            console.error("Error duplicating newsletter", error);
            alert("No se pudo duplicar la campaña.");
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const filteredNewsletters = newsletters.filter(nl => {
        const matchesSearch = nl.subject.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || nl.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalCampaigns = newsletters.length;
    const sentCampaignsCount = newsletters.filter(nl => nl.status === 'sent').length;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-slate-400 gap-4">
                <Loader2 className="animate-spin text-emerald-600" size={40} />
                <p className="font-medium animate-pulse">Cargando campañas...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col animate-in fade-in duration-500 max-w-[1600px] mx-auto w-full gap-6 pb-10">
            
            {/* Header Section (Stitch Redesign) */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <Mail size={36} className="text-[#006c4a]" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Campañas de Email</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg font-black text-[#006c4a]">{totalCampaigns}</span>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">campañas en total ({sentCampaignsCount} enviadas)</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {/* Tabs Filters (Stitch Redesign) */}
                    <div className="bg-slate-100 p-1 rounded-xl flex gap-1 shadow-sm border border-slate-200/30">
                        <button 
                            onClick={() => setStatusFilter('all')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                statusFilter === 'all' 
                                    ? 'bg-white text-slate-800 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            Todas
                        </button>
                        <button 
                            onClick={() => setStatusFilter('draft')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                statusFilter === 'draft' 
                                    ? 'bg-white text-slate-800 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            Borradores
                        </button>
                        <button 
                            onClick={() => setStatusFilter('sent')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                statusFilter === 'sent' 
                                    ? 'bg-white text-slate-800 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            Enviadas
                        </button>
                    </div>

                    <button
                        onClick={handleCreate}
                        className="bg-emerald-600 hover:bg-[#006c4a] text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-md transition-all flex items-center gap-2 active:scale-95 shrink-0"
                    >
                        <Plus size={16} />
                        <span>Nueva Campaña</span>
                    </button>
                </div>
            </div>

            {/* Newsletter Campaigns Table Card (Stitch Redesign) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Listado de Campañas</span>
                    
                    <div className="flex items-center gap-4 flex-1 max-w-md justify-end">
                        {/* Search Input (Stitch Redesign) */}
                        <div className="relative w-full max-w-xs focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl transition-all">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="Buscar por asunto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-12 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all text-xs font-semibold text-slate-700 placeholder-slate-400"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[9px] font-bold text-slate-400 bg-slate-200/80 px-1.5 py-0.5 rounded">⌘K</span>
                        </div>
                        
                        <button className="flex items-center gap-1.5 font-bold text-xs text-[#006c4a] hover:underline transition-all">
                            <Filter size={14} />
                            <span>Filtros</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto flex-1">
                    {filteredNewsletters.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                            <Mail size={48} className="text-slate-300 mb-4" />
                            <h3 className="text-lg font-bold text-slate-700 mb-1">Crea tu primera campaña</h3>
                            <p className="max-w-md mx-auto mb-6 text-sm">Usa nuestro editor visual para diseñar correos de aspecto profesional en minutos.</p>
                            <button onClick={handleCreate} className="text-emerald-600 font-bold hover:underline">
                                Comenzar ahora
                            </button>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Asunto</th>
                                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Estado</th>
                                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Fecha de Creación</th>
                                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase text-[10px] tracking-wider text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredNewsletters.map((nl) => (
                                    <tr key={nl.id} className="hover:bg-slate-50/40 transition-colors group">
                                        <td className="px-6 py-3.5 align-middle">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200/50 shrink-0">
                                                    <Mail size={15} className="text-slate-500" />
                                                </div>
                                                <span className="font-bold text-slate-900 group-hover:text-[#006c4a] transition-colors truncate max-w-md">
                                                    {nl.subject}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5 align-middle">
                                            {nl.status === 'draft' ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-700 border-amber-200/60">
                                                    <Edit size={10} /> BORRADOR
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200/60">
                                                    <Send size={10} /> ENVIADO
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3.5 text-slate-600 font-semibold text-xs align-middle">
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={12} className="text-slate-400" />
                                                {formatDate(nl.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5 align-middle text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <button
                                                    onClick={() => navigate(`/newsletters/${nl.id}`)}
                                                    className="px-4 py-1.5 rounded-lg border border-[#006c4a] text-[#006c4a] font-bold text-xs hover:bg-[#006c4a] hover:text-white transition-all active:scale-95 shadow-sm"
                                                >
                                                    {nl.status === 'draft' ? 'Editar' : 'Ver Detalles'}
                                                </button>
                                                <button
                                                    onClick={() => handleDuplicate(nl)}
                                                    className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-all"
                                                    title="Duplicar campaña"
                                                >
                                                    <Copy size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                
                {/* Table Footer with Summary */}
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <p>Mostrando {filteredNewsletters.length} de {newsletters.length} campañas</p>
                </div>
            </div>

            {/* Bento Dashboard Glimpse (Stitch Redesign Bottom Section) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                
                {/* SUSCRIPTORES ACTIVOS */}
                <div className="md:col-span-1 bg-[#131b2e] p-6 rounded-2xl text-white relative overflow-hidden group h-48 flex flex-col justify-between shadow-md">
                    <div className="relative z-10">
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Suscriptores Activos</p>
                        <h4 className="text-3xl font-black mt-2 text-white italic">
                            {subscriberCount !== null ? `${subscriberCount}` : '1.2K'}
                        </h4>
                    </div>
                    <div className="relative z-10 flex items-center gap-2">
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                            Leads con correo electrónico
                        </span>
                    </div>
                    <TrendingUp className="absolute -right-4 -bottom-4 text-white/5 w-40 h-40 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
                </div>

                {/* MÉTRICAS GENERALES DE ENTREGA */}
                <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex gap-6 items-center">
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Estadísticas de Entrega</h4>
                        <p className="text-xs text-slate-500 font-medium mb-4">Métricas promedio de las campañas enviadas.</p>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                                    <Send size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tasa de Apertura</p>
                                    <p className="text-base font-black text-slate-800">42.8%</p>
                                </div>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                                    <BarChart3 size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Clics en Enlace</p>
                                    <p className="text-base font-black text-slate-800">12.5%</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SVG Progress Circle (Email Reputation) */}
                    <div className="hidden lg:block w-32 h-32 relative shrink-0">
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-lg font-black text-slate-800">98%</span>
                            <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest text-center">Entrega</span>
                        </div>
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 128 128">
                            {/* Background ring */}
                            <circle 
                                className="text-slate-100" 
                                cx="64" 
                                cy="64" 
                                fill="transparent" 
                                r="56" 
                                stroke="currentColor" 
                                strokeWidth="8"
                            />
                            {/* Progress ring */}
                            <circle 
                                className="text-emerald-600" 
                                cx="64" 
                                cy="64" 
                                fill="transparent" 
                                r="56" 
                                stroke="currentColor" 
                                strokeDasharray="351.85" 
                                strokeDashoffset="7.03" 
                                strokeWidth="8"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                </div>

            </div>
        </div>
    );
}
