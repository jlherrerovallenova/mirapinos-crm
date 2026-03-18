-- Add 'interested_in' column to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS interested_in text;

COMMENT ON COLUMN public.leads.interested_in IS 'Propiedad o modelo en el que el cliente está interesado';
