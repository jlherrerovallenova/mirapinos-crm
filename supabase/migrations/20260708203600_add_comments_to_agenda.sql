-- Add comments column to agenda table
ALTER TABLE public.agenda 
ADD COLUMN IF NOT EXISTS comments TEXT;

COMMENT ON COLUMN public.agenda.comments IS 'Comentarios adicionales sobre la acción (para Llamada, Visita o Reunión)';
