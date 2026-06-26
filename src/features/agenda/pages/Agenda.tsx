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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Agenda Global</h1>
            <p className="text-slate-500 text-xs font-medium">Organización y seguimiento de tareas diarias.</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            {/* Selector de Vista */}
            <div className="flex bg-slate-100 rounded-xl p-1 shadow-inner border border-slate-200/50">
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                title="Vista Calendario"
              >
                <CalendarIcon size={16} />
                <span className="hidden sm:inline">Calendario</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                title="Vista Listado"
              >
                <List size={16} />
                <span className="hidden sm:inline">Listado</span>
              </button>
            </div>

            {/* Filtros de Estado */}
            <div className="flex bg-slate-50 rounded-xl border border-slate-200 overflow-hidden p-1 shadow-inner">
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
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
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
              className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95 text-xs"
            >
              <Plus size={18} /> Nueva Tarea
            </button>
          </div>
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