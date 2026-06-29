// src/pages/Agenda.tsx
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { agendaService } from '../api/agendaService';
import {
  Calendar as CalendarIcon,
  Plus,
  List
} from 'lucide-react';
import CreateTaskModal from '../components/CreateTaskModal';
import { useDialog } from '../../../context/DialogContext';
import type { Database } from '../../../types/supabase';
import AgendaCalendarView from '../components/AgendaCalendarView';
import AgendaListView from '../components/AgendaListView';

// Tipo AgendaItem enriquecido con datos del cliente
type AgendaItem = Database['public']['Tables']['agenda']['Row'] & {
  leads?: { name: string } | null
};

interface AgentInfo {
  id: string;
  full_name: string | null;
  email: string | null;
}

const ITEMS_PER_PAGE = 8;

export default function Agenda() {
  const { session, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('pending');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCellDate, setSelectedCellDate] = useState<string | undefined>(undefined);
  const { showConfirm, showAlert } = useDialog();

  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('all');

  const fetchAgents = useCallback(async () => {
    try {
      const data = await agendaService.getAgents();
      setAgents(data);
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
  }, []);

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchAgents();
    }
  }, [profile, fetchAgents]);

  const fetchAgenda = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const { data, count } = await agendaService.fetchItems({
        filterStatus,
        selectedAgentId,
        currentUserId: session.user?.id,
        isAdmin: profile?.role === 'admin',
        viewMode,
        currentDate,
        page,
        itemsPerPage: ITEMS_PER_PAGE
      });

      setItems(data);
      if (count !== null) setTotalItems(count);
    } catch (error) {
      console.error('Error fetching agenda:', error);
    } finally {
      setLoading(false);
    }
  }, [session, filterStatus, selectedAgentId, profile, viewMode, currentDate, page]);

  useEffect(() => {
    fetchAgenda();

    // Check for "create=true" to open the New Task modal
    if (searchParams.get('create') === 'true') {
      setIsCreateModalOpen(true);
      // Clean up the URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('create');
      setSearchParams(newParams, { replace: true });
    }
  }, [fetchAgenda, searchParams, setSearchParams]);

  const toggleStatus = async (item: AgendaItem) => {
    const newStatus = !item.completed;
    try {
      await agendaService.toggleStatus(item.id, newStatus);
      fetchAgenda();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const deleteItem = async (id: number) => {
    const confirmed = await showConfirm({
      title: 'Eliminar Tarea',
      message: '¿Estás seguro de que deseas eliminar esta tarea de la agenda de forma permanente?',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar'
    });
    if (!confirmed) return;
    try {
      await agendaService.deleteItem(id);
      fetchAgenda();
    } catch (error) {
      console.error('Error deleting task:', error);
      await showAlert({ title: 'Error', message: 'No se pudo eliminar la tarea' });
    }
  };

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col animate-in fade-in duration-500 max-w-[1600px] mx-auto w-full gap-6 pb-10">
      
      {/* Header Section (Stitch Redesign) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <CalendarIcon size={36} className="text-[#006c4a]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Agenda Global</h2>
            <p className="text-slate-500 text-xs font-semibold mt-1">Organización y seguimiento de tareas diarias.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center self-start md:self-auto shrink-0">
          {/* Selector de Vista (Stitch Redesign) */}
          <div className="flex bg-slate-100 rounded-xl p-1 shadow-sm border border-slate-200/30">
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              title="Vista Calendario"
            >
              <CalendarIcon size={14} />
              <span className="hidden sm:inline">Calendario</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              title="Vista Listado"
            >
              <List size={14} />
              <span className="hidden sm:inline">Listado</span>
            </button>
          </div>

          {/* Filtros de Estado */}
          <div className="flex bg-slate-100 rounded-xl p-1 shadow-sm border border-slate-200/30">
            <button
              onClick={() => { setFilterStatus('pending'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Pendientes
            </button>
            <button
              onClick={() => { setFilterStatus('completed'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === 'completed' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Completadas
            </button>
            <button
              onClick={() => { setFilterStatus('all'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === 'all' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Todas
            </button>
          </div>

          {/* Filtro por Asesor (solo Administradores) */}
          {profile?.role === 'admin' && (
            <select
              value={selectedAgentId}
              onChange={(e) => {
                setSelectedAgentId(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
            >
              <option value="all">👥 Todos los asesores</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  👤 {agent.full_name || agent.email}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => { setSelectedCellDate(undefined); setIsCreateModalOpen(true); }}
            className="bg-[#006c4a] hover:bg-[#005137] text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 shrink-0"
          >
            <Plus size={16} />
            <span>Nueva Tarea</span>
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <AgendaCalendarView
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          items={items}
          loading={loading}
          agents={agents}
          profile={profile}
          onToggleStatus={toggleStatus}
          onSelectCellDate={setSelectedCellDate}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <AgendaListView
          items={items}
          loading={loading}
          totalItems={totalItems}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          agents={agents}
          profile={profile}
          onToggleStatus={toggleStatus}
          onDeleteItem={deleteItem}
        />
      )}

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedCellDate(undefined);
        }}
        onSuccess={() => fetchAgenda()}
        defaultDate={selectedCellDate}
      />
    </div>
  );
}