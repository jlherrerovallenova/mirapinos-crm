-- Migration: Activate Security (RLS) for Core Tables
-- Date: 2026-05-05

-------------------------------------------------------
-- 1. PROFILES
-------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Los administradores pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Los administradores pueden actualizar cualquier perfil
CREATE POLICY "Admins can update profiles" 
ON public.profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-------------------------------------------------------
-- 2. LEADS (CLIENTES)
-------------------------------------------------------
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Los agentes pueden ver los leads asignados a ellos
-- Los administradores pueden ver todos
CREATE POLICY "Users can view assigned leads" 
ON public.leads FOR SELECT 
USING (
  assigned_to = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Cualquier usuario autenticado puede insertar un nuevo lead (para prospección)
CREATE POLICY "Authenticated users can insert leads" 
ON public.leads FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Los agentes pueden actualizar sus propios leads
-- Los administradores pueden actualizar todos
CREATE POLICY "Users can update assigned leads" 
ON public.leads FOR UPDATE 
USING (
  assigned_to = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Solo administradores pueden borrar leads
CREATE POLICY "Only admins can delete leads" 
ON public.leads FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-------------------------------------------------------
-- 3. AGENDA (TAREAS)
-------------------------------------------------------
ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;

-- Los usuarios gestionan sus propias tareas
CREATE POLICY "Users can manage own agenda" 
ON public.agenda FOR ALL 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-------------------------------------------------------
-- 4. INVENTORY (VIVIENDAS)
-------------------------------------------------------
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Todos los usuarios autenticados pueden ver el inventario
CREATE POLICY "Authenticated users can view inventory" 
ON public.inventory FOR SELECT 
USING (auth.role() = 'authenticated');

-- Solo administradores pueden modificar el inventario
CREATE POLICY "Only admins can modify inventory" 
ON public.inventory FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
