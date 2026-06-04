-- Migration: Configurar recordatorios diarios de la agenda
-- Date: 2026-05-08

-- 1. Habilitar extensiones necesarias (si no están habilitadas)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Limpiar job previo si existe para evitar duplicados
SELECT cron.unschedule('agenda-reminders-daily');

-- 3. Programar el recordatorio diario a las 9:00 AM (Hora de España)
-- Supabase cron usa UTC. España es UTC+1 (Invierno) o UTC+2 (Verano).
-- A las 9:00 AM en España es a las 7:00 AM UTC (Verano) o 8:00 AM UTC (Invierno).
-- Usamos 0 7 * * * para que llegue temprano.

-- IMPORTANTE: Reemplazar [SERVICE_ROLE_KEY] con la clave real del proyecto
-- o configurar la función para que no requiera auth (no recomendado).
-- Lo ideal es llamar a la función internamente.

SELECT cron.schedule(
  'agenda-reminders-daily',
  '0 7 * * *', -- 9:00 AM (aprox) en España
  $$
  SELECT net.http_post(
    url := 'https://nbrbggvdtbvaoxsllemf.supabase.co/functions/v1/agenda-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);

COMMENT ON COLUMN public.agenda.due_date IS 'Fecha y hora de la cita/tarea';
