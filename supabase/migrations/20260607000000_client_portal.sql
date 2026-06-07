-- MIGRACIÓN: Portal de Cliente
-- Fecha: 2026-06-07

-- 1. Actualizar roles permitidos en profiles
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'agent', 'viewer', 'client'));

-- 2. Añadir enlace con usuario a la tabla leads
ALTER TABLE public.leads 
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Políticas RLS para clientes
-- Leads: El cliente puede ver su propia ficha
CREATE POLICY "Clients can view own lead"
  ON public.leads FOR SELECT
  USING (auth_user_id = auth.uid());

-- Sales: El cliente puede ver sus propias ventas
CREATE POLICY "Clients can view own sales"
  ON public.sales FOR SELECT
  USING (lead_id IN (SELECT id FROM public.leads WHERE auth_user_id = auth.uid()));

-- Installments: El cliente puede ver sus propias cuotas
CREATE POLICY "Clients can view own installments"
  ON public.installments FOR SELECT
  USING (sale_id IN (SELECT id FROM public.sales WHERE lead_id IN (SELECT id FROM public.leads WHERE auth_user_id = auth.uid())));

-- Sale Documents: El cliente puede ver sus propios documentos
CREATE POLICY "Clients can view own documents"
  ON public.sale_documents FOR SELECT
  USING (sale_id IN (SELECT id FROM public.sales WHERE lead_id IN (SELECT id FROM public.leads WHERE auth_user_id = auth.uid())));
