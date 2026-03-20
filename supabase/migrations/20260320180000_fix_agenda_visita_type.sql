-- Actualizar la restricción de tipo en la tabla agenda
ALTER TABLE public.agenda 
DROP CONSTRAINT IF EXISTS agenda_type_check;

ALTER TABLE public.agenda 
ADD CONSTRAINT agenda_type_check 
CHECK (type IN ('Llamada', 'Email', 'WhatsApp', 'Visita', 'Reunión'));

COMMENT ON COLUMN public.agenda.type IS 'Tipos permitidos: Llamada, Email, WhatsApp, Visita, Reunión';
