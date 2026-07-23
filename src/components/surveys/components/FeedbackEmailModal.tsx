import { useState } from 'react';
import { X, Send, Loader2, MessageSquare } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { getFeedbackEmailTemplate } from '../utils/feedbackTemplates';
import { useDialog } from '../../../context/DialogContext';
import { useAuth } from '../../../context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lead: {
    id: string;
    name: string;
    email: string | null;
    source: string | null;
  };
  onSuccess: () => void;
}

export default function FeedbackEmailModal({ isOpen, onClose, lead, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const { showAlert, showConfirm } = useDialog();
  const { session } = useAuth();

  if (!isOpen) return null;

  const handleSendFeedbackEmail = async () => {
    if (!lead.email) {
      await showAlert({ title: 'Error', message: 'El cliente no tiene un correo electrónico registrado.' });
      return;
    }

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const proceed = await showConfirm({
        title: 'Advertencia: Entorno Local',
        message: 'Estás ejecutando la aplicación en modo local (localhost). Si envías esta encuesta, el enlace apuntará a tu equipo y no funcionará para el cliente. ¿Deseas enviarla de todos modos?',
        confirmText: 'Enviar de todos modos',
        cancelText: 'Cancelar',
      });
      if (!proceed) return;
    }

    setLoading(true);
    try {
      // 1. Preparar el contenido
      const baseUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
      const emailHtml = getFeedbackEmailTemplate(lead.name, 'Finca Mirapinos', lead.id, baseUrl);

      // 2. Enviar vía Supabase Edge Function
      const { data, error: sendError } = await supabase.functions.invoke('send-email', {
        body: {
          to: lead.email,
          subject: 'Una breve opinión sobre Finca Mirapinos',
          html: emailHtml,
        },
      });

      if (sendError || data?.error) {
        throw new Error(data?.error || sendError?.message || 'Error al enviar el email');
      }

      // 3. Actualizar base de datos
      const { error: dbError } = await (supabase as any)
        .from('leads')
        .update({ 
          feedback_sent: true,
          feedback_sent_at: new Date().toISOString()
        } as any)
        .eq('id', lead.id);

      if (dbError) throw dbError;

      // 4. Registrar en la agenda del lead como actividad completada
      const { error: agendaError } = await (supabase as any)
        .from('agenda')
        .insert([{
          lead_id: lead.id,
          user_id: session?.user?.id,
          type: 'Email',
          title: 'Solicitud de opinión de Finca Mirapinos enviada al cliente.',
          due_date: new Date().toISOString(),
          completed: true
        }]);

      if (agendaError) {
        console.error('Error logging survey send to agenda:', agendaError);
      }

      await showAlert({ 
        title: '¡Email Enviado!', 
        message: `Se ha enviado la solicitud de opinión a ${lead.name} correctamente.` 
      });
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error enviando feedback:', err);
      await showAlert({ title: 'Error', message: err.message || 'No se pudo enviar el correo. Verifica tu conexión.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        
        {/* HEADER OSCURO ESTILO FICHA CLIENTE */}
        <div className="bg-[#131b2e] px-6 py-4 flex items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs text-white bg-blue-600/80 border border-blue-500/30">
              <MessageSquare size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Encuesta de Satisfacción
              </p>
              <h2 className="text-white font-bold text-base leading-tight">
                Enviar a <span className="text-emerald-400 font-extrabold">{lead.name}</span> encuesta por email
              </h2>
            </div>
          </div>
          
          {/* BOTÓN CERRAR */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white shrink-0"
            title="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* CUERPO Y CONTENIDO */}
        <div className="p-6 space-y-5">
          {/* TEXTO DE DESTINATARIO Y PROMOCIÓN */}
          <p className="text-slate-700 text-sm leading-relaxed">
            Se va a enviar un correo electrónico a{' '}
            <strong className="font-bold text-slate-900">{lead.name}</strong>{' '}
            <span className="text-slate-500 font-medium">({lead.email || 'sin correo registrado'})</span> solicitando su opinión sobre{' '}
            <strong className="font-bold text-slate-900 uppercase tracking-wide">FINCA MIRAPINOS</strong>.
          </p>

          {/* CAJA INFORMATIVA */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-slate-500 text-xs font-medium leading-relaxed">
            El correo electrónico contiene el nuevo diseño corporativo e incluye un botón interactivo para comenzar la encuesta de satisfacción.
          </div>

          {/* FOOTER CON BOTONES DE ACCIÓN */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-slate-500 font-semibold text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSendFeedbackEmail}
              disabled={loading || !lead.email}
              className="px-6 py-2.5 bg-[#131b2e] hover:bg-slate-800 rounded-lg font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 shadow-sm"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              <span>Enviar encuesta</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
