-- Update existing leads that had Instagram or Facebook as source to use "Redes Sociales"
UPDATE public.leads
SET source = 'Redes Sociales'
WHERE source IN ('Instagram', 'Facebook');
