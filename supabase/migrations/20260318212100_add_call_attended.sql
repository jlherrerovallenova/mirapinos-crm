-- Add call_attended column to agenda table
ALTER TABLE public.agenda 
ADD COLUMN IF NOT EXISTS call_attended BOOLEAN;

COMMENT ON COLUMN public.agenda.call_attended IS 'Estado de la llamada: true = atendida, false = no atendida, NULL = pendiente';
