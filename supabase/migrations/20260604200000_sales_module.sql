-- MIGRACIÓN: Módulo de Compra-Venta
-- Fecha: 2026-06-04

-- 1. Nuevos campos en la tabla leads (datos personales para contrato)
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS dni TEXT,
  ADD COLUMN IF NOT EXISTS civil_status TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'Española',
  ADD COLUMN IF NOT EXISTS occupation TEXT,
  ADD COLUMN IF NOT EXISTS joint_buyer_name TEXT,
  ADD COLUMN IF NOT EXISTS joint_buyer_dni TEXT,
  ADD COLUMN IF NOT EXISTS joint_buyer_email TEXT,
  ADD COLUMN IF NOT EXISTS joint_buyer_phone TEXT,
  ADD COLUMN IF NOT EXISTS property_id INTEGER REFERENCES inventory(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sale_status TEXT DEFAULT NULL;

-- 2. Tabla de ventas (expediente por operación)
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  property_id INTEGER NOT NULL REFERENCES inventory(id) ON DELETE RESTRICT,
  sale_status TEXT NOT NULL DEFAULT 'reserva'
    CHECK (sale_status IN ('reserva','contrato','mensualidades','escrituracion','completada')),
  sale_price NUMERIC(12,2) NOT NULL,
  iva_percentage NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  reservation_amount NUMERIC(12,2) NOT NULL DEFAULT 6000.00,
  reservation_date DATE,
  contract_date DATE,
  escritura_date DATE,
  notes TEXT
);

-- 3. Tabla de recibos mensuales (24 cuotas por venta)
CREATE TABLE IF NOT EXISTS installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL CHECK (installment_number BETWEEN 1 AND 24),
  due_date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT FALSE,
  paid_date DATE,
  UNIQUE (sale_id, installment_number)
);

-- 4. Tabla de metadatos de documentos asociados a la venta
CREATE TABLE IF NOT EXISTS public.sale_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Ruta en el bucket de storage
  document_type TEXT NOT NULL CHECK (document_type IN ('reserva', 'contrato', 'banco', 'dni_comprador', 'dni_cotitular', 'otros')),
  file_size INT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 5. Habilitar RLS
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_documents ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS (acceso para usuarios autenticados)
-- Sales
CREATE POLICY "Authenticated users can read sales"
  ON sales FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert sales"
  ON sales FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update sales"
  ON sales FOR UPDATE USING (auth.role() = 'authenticated');

-- Installments
CREATE POLICY "Authenticated users can read installments"
  ON installments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert installments"
  ON installments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update installments"
  ON installments FOR UPDATE USING (auth.role() = 'authenticated');

-- Sale Documents
CREATE POLICY "Authenticated users can read sale_documents"
  ON public.sale_documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert sale_documents"
  ON public.sale_documents FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update sale_documents"
  ON public.sale_documents FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete sale_documents"
  ON public.sale_documents FOR DELETE USING (auth.role() = 'authenticated');

-- 7. Crear el bucket de almacenamiento de Supabase (Privado)
INSERT INTO storage.buckets (id, name, public)
VALUES ('sale-documents', 'sale-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 8. Políticas de almacenamiento en el bucket para usuarios autenticados
-- 8.1 SELECT (Lectura)
DROP POLICY IF EXISTS "Authenticated read sale-documents" ON storage.objects;
CREATE POLICY "Authenticated read sale-documents" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'sale-documents');

-- 8.2 INSERT (Subida)
DROP POLICY IF EXISTS "Authenticated upload sale-documents" ON storage.objects;
CREATE POLICY "Authenticated upload sale-documents" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'sale-documents');

-- 8.3 UPDATE (Actualización/Sobrescritura)
DROP POLICY IF EXISTS "Authenticated update sale-documents" ON storage.objects;
CREATE POLICY "Authenticated update sale-documents" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'sale-documents');

-- 8.4 DELETE (Borrado)
DROP POLICY IF EXISTS "Authenticated delete sale-documents" ON storage.objects;
CREATE POLICY "Authenticated delete sale-documents" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'sale-documents');
