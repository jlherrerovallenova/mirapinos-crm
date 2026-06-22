-- Añadir columna tracking_id a la tabla agenda para enlazar con email_tracking
ALTER TABLE agenda ADD COLUMN IF NOT EXISTS tracking_id UUID REFERENCES email_tracking(id) ON DELETE SET NULL;
