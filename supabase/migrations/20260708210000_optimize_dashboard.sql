-- Migration to optimize dashboard stats and queries using database RPC functions

-- 1. Optimized function to calculate dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSONB
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_leads INT;
  v_top_sources JSONB;
BEGIN
  -- Count total leads
  SELECT COUNT(*) INTO v_total_leads FROM leads;

  -- Aggregate top 3 sources
  SELECT jsonb_agg(sub) INTO v_top_sources
  FROM (
    SELECT 
      COALESCE(NULLIF(TRIM(source), ''), 'Desconocido') AS name,
      COUNT(*) AS count,
      CASE WHEN v_total_leads > 0 THEN ROUND((COUNT(*)::NUMERIC / v_total_leads) * 100) ELSE 0 END AS percentage
    FROM leads
    GROUP BY COALESCE(NULLIF(TRIM(source), ''), 'Desconocido')
    ORDER BY count DESC, name ASC
    LIMIT 3
  ) sub;

  RETURN jsonb_build_object(
    'totalLeads', v_total_leads,
    'topSources', COALESCE(v_top_sources, '[]'::jsonb)
  );
END;
$$;

-- 2. Optimized function to fetch leads without any agenda activities
CREATE OR REPLACE FUNCTION get_no_activity_leads(p_limit INT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  source TEXT,
  created_at TIMESTAMPTZ
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT l.id, l.name, l.source, l.created_at
  FROM leads l
  WHERE NOT EXISTS (
    SELECT 1 FROM agenda a WHERE a.lead_id = l.id
  )
  ORDER BY l.created_at DESC
  LIMIT p_limit;
END;
$$;
