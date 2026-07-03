-- supabase/migrations/20260702120000_add_surveys.sql

-- 1. Añadir columnas para la encuesta en la tabla leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS feedback_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS feedback_sent_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS feedback_rating TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS feedback_comment TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS feedback_responded_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS survey_data JSONB DEFAULT '{}'::jsonb;

-- Comentarios explicativos
COMMENT ON COLUMN public.leads.feedback_sent IS 'Indica si se ha enviado la solicitud de encuesta de opinión';
COMMENT ON COLUMN public.leads.feedback_sent_at IS 'Fecha y hora en la que se envió la solicitud de encuesta';
COMMENT ON COLUMN public.leads.feedback_rating IS 'Valoración de la pregunta 1 de la encuesta';
COMMENT ON COLUMN public.leads.feedback_comment IS 'Comentarios opcionales de la encuesta';
COMMENT ON COLUMN public.leads.feedback_responded_at IS 'Fecha y hora de respuesta del cliente';
COMMENT ON COLUMN public.leads.survey_data IS 'Respuestas detalladas en formato JSONB';

-- 2. Crear función RPC para el envío seguro de la encuesta
CREATE OR REPLACE FUNCTION public.submit_lead_survey(
    p_lead_id UUID,
    p_survey_data JSONB
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Se ejecuta con privilegios del creador de la función para saltar RLS
SET search_path = public
AS $$
DECLARE
    v_rating_label TEXT;
    v_description TEXT;
    v_assigned_to UUID;
BEGIN
    -- Validar que el lead existe y se envió la encuesta
    IF NOT EXISTS (
        SELECT 1 FROM public.leads 
        WHERE id = p_lead_id 
        AND feedback_sent = true 
    ) THEN
        RAISE EXCEPTION 'Feedback inválido o lead inexistente.';
    END IF;

    -- Obtener el agente asignado al lead
    SELECT assigned_to INTO v_assigned_to
    FROM public.leads
    WHERE id = p_lead_id;

    -- Actualizar el lead con la respuesta
    UPDATE public.leads
    SET 
        survey_data = p_survey_data,
        feedback_responded_at = NOW(),
        feedback_rating = p_survey_data->>'pregunta_1'
    WHERE id = p_lead_id;

    -- Traducir el código de respuesta para la primera pregunta a una descripción amigable
    v_rating_label := CASE p_survey_data->>'pregunta_1'
        WHEN 'mas_info' THEN 'Me interesa, quiero más información.'
        WHEN 'pensarlo' THEN 'Me interesa, pero necesito tiempo para pensarlo.'
        WHEN 'no_encaja' THEN 'No encaja con lo que estoy buscando actualmente.'
        WHEN 'encontrado' THEN 'Ya he encontrado otra vivienda.'
        ELSE COALESCE(p_survey_data->>'pregunta_1', '')
    END;

    v_description := 'Encuesta de opinión respondida por el cliente. Valoración: ' || v_rating_label;

    -- Insertar la respuesta en la tabla agenda como una actividad de tipo Email completada
    INSERT INTO public.agenda (lead_id, user_id, title, type, due_date, completed)
    VALUES (
        p_lead_id,
        v_assigned_to,
        v_description,
        'Email',
        NOW(),
        true
    );
END;
$$;

-- Otorgar permisos de ejecución al rol anónimo (público) y autenticado
REVOKE EXECUTE ON FUNCTION public.submit_lead_survey(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_lead_survey(UUID, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_lead_survey(UUID, JSONB) TO authenticated;
