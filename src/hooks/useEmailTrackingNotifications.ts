import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface NotificationData {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export function useEmailTrackingNotifications(
  showNotification: (data: NotificationData) => void
) {
  useEffect(() => {
    // Suscribirse a actualizaciones en la tabla email_tracking
    const subscription = supabase
      .channel('email-opens')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'email_tracking',
          filter: 'status=eq.opened' // Notificar solo cuando el estado cambia a opened
        },
        async (payload) => {
          const newRecord = payload.new;
          const oldRecord = payload.old;

          // Solo notificamos en el primer open o si quieres notificar en todos los opens
          // Para no hacer spam, notifiquemos solo cuando el opens_count cambia
          if (newRecord.opens_count > (oldRecord?.opens_count || 0)) {
            // Obtener info del lead
            const { data: lead } = await supabase
              .from('leads')
              .select('name, status')
              .eq('id', newRecord.lead_id)
              .single();

            // Solo notificar si el lead es "caliente" o siempre. 
            // Mostramos siempre para depurar, pero con mensaje especial si es "caliente"
            const hotStatuses = ['qualified', 'proposal', 'negotiation'];
            const isHot = lead && hotStatuses.includes(lead.status);

            showNotification({
              title: isHot ? "🔥 ¡Email Abierto (Lead Caliente)!" : "📧 Email Abierto",
              message: `El cliente ${lead?.name || 'Desconocido'} ha abierto tu correo "${newRecord.subject}". Aperturas totales: ${newRecord.opens_count}`,
              type: "success"
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [showNotification]);
}
