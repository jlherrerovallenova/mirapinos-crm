import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, Calendar, Clock, MapPin, User, Tag, MessageSquare, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Lead, Appointment, Task } from '../../types/supabase';
import CreateAppointmentModal from '../CreateAppointmentModal';

interface LeadDetailModalProps {
  lead: Lead;
  onClose: () => void;
  onUpdate: () => void;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ lead, onClose, onUpdate }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'appointments' | 'tasks'>('appointments');

  useEffect(() => {
    fetchLeadData();
  }, [lead.id]);

  const fetchLeadData = async () => {
    try {
      setLoading(true);
      const [appointmentsRes, tasksRes] = await Promise.all([
        supabase
          .from('appointments')
          .select('*')
          .eq('lead_id', lead.id)
          .order('start_time', { ascending: true }),
        supabase
          .from('tasks')
          .select('*')
          .eq('lead_id', lead.id)
          .order('created_at', { ascending: false })
      ]);

      if (appointmentsRes.data) setAppointments(appointmentsRes.data);
      if (tasksRes.data) setTasks(tasksRes.data);
    } catch (error) {
      console.error('Error fetching lead data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: task.status === 'completed' ? 'pending' : 'completed' })
        .eq('id', task.id);

      if (error) throw error;
      fetchLeadData();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-md w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {lead.first_name} {lead.last_name}
            </h2>
            <div className="flex gap-2 mt-1">
              <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {lead.status.toUpperCase()}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-200 rounded-md transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Body Content - Two Columns */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Columna Izquierda: Datos del Lead */}
            <div className="space-y-6">
              <section>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" /> Información Personal
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-md border border-gray-100">
                    <Mail className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium">{lead.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-md border border-gray-100">
                    <Phone className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="text-xs text-gray-500">Teléfono</p>
                      <p className="text-sm font-medium">{lead.phone || 'No disponible'}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Detalles de Interés
                </h3>
                <div className="bg-gray-50 p-4 rounded-md border border-gray-100 space-y-4">
                  <div>
                    <p className="text-xs text-gray-500">Origen del lead</p>
                    <p className="text-sm font-medium capitalize mt-1">{lead.source}</p>
                  </div>
                  {lead.notes && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> Notas
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded-md border border-gray-100 italic">
                        "{lead.notes}"
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Columna Derecha: Agenda (Citas y Tareas) */}
            <div className="bg-gray-50 rounded-md p-6 border border-gray-200 flex flex-col h-full min-h-[400px]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setActiveTab('appointments')}
                    className={`pb-2 text-sm font-bold transition-colors ${
                      activeTab === 'appointments' 
                        ? 'text-indigo-600 border-b-2 border-indigo-600' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Citas
                  </button>
                  <button 
                    onClick={() => setActiveTab('tasks')}
                    className={`pb-2 text-sm font-bold transition-colors ${
                      activeTab === 'tasks' 
                        ? 'text-indigo-600 border-b-2 border-indigo-600' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Tareas
                  </button>
                </div>
                <button 
                  onClick={() => setShowAppointmentModal(true)}
                  className="flex items-center gap-1 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-shadow shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Nueva
                </button>
              </div>

              {loading ? (
                <div className="flex-1 flex justify-center items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {activeTab === 'appointments' ? (
                    appointments.length > 0 ? (
                      appointments.map((appointment) => (
                        <div key={appointment.id} className="bg-white p-4 rounded-md shadow-sm border border-gray-200 hover:border-indigo-300 transition-colors">
                          <h4 className="font-semibold text-gray-900 text-sm">{appointment.title}</h4>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(appointment.start_time).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(appointment.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 italic py-10">
                        <Calendar className="w-10 h-10 mb-2 opacity-20" />
                        <p className="text-sm">No hay citas programadas</p>
                      </div>
                    )
                  ) : (
                    tasks.length > 0 ? (
                      tasks.map((task) => (
                        <div 
                          key={task.id} 
                          className="bg-white p-3 rounded-md shadow-sm border border-gray-200 flex items-center justify-between group hover:border-indigo-300 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <button onClick={() => toggleTaskStatus(task)} className="focus:outline-none">
                              {task.status === 'completed' ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-300 hover:text-indigo-400" />
                              )}
                            </button>
                            <span className={`text-sm ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                              {task.title}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 italic py-10">
                        <Clock className="w-10 h-10 mb-2 opacity-20" />
                        <p className="text-sm">No hay tareas pendientes</p>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAppointmentModal && (
        <CreateAppointmentModal
          leadId={lead.id}
          onClose={() => setShowAppointmentModal(false)}
          onSuccess={() => {
            setShowAppointmentModal(false);
            fetchLeadData();
            onUpdate();
          }}
        />
      )}
    </div>
  );
};

export default LeadDetailModal;