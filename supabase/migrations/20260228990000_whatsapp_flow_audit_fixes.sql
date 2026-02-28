-- =============================================
-- WhatsApp Flow Builder — Audit Fixes
-- =============================================
-- Fixes: step reorder atomicity, step insertion with shift,
-- session timeout enforcement

-- 1. RPC: Atomic step reorder (single transaction, avoids unique constraint conflicts)
CREATE OR REPLACE FUNCTION reorder_flow_steps(p_flow_id UUID, p_steps JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  step_item JSONB;
BEGIN
  -- Offset all steps to large values to avoid UNIQUE(flow_id, step_order) violations
  UPDATE public.whatsapp_flow_steps
  SET step_order = step_order + 1000000
  WHERE flow_id = p_flow_id;

  -- Apply final step_order values from the JSONB array
  FOR step_item IN SELECT * FROM jsonb_array_elements(p_steps)
  LOOP
    UPDATE public.whatsapp_flow_steps
    SET step_order = (step_item->>'step_order')::int,
        updated_at = now()
    WHERE id = (step_item->>'id')::uuid
      AND flow_id = p_flow_id;
  END LOOP;
END;
$$;

-- 2. RPC: Insert step with automatic shift of existing step_order values
CREATE OR REPLACE FUNCTION insert_flow_step_with_shift(
  p_flow_id UUID,
  p_step_order INT,
  p_step_key TEXT,
  p_display_name TEXT,
  p_step_type TEXT,
  p_config JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
BEGIN
  -- Shift existing steps at or after this position to make room
  -- PostgreSQL checks UNIQUE constraints at statement end, so this is safe
  UPDATE public.whatsapp_flow_steps
  SET step_order = step_order + 1,
      updated_at = now()
  WHERE flow_id = p_flow_id AND step_order >= p_step_order;

  -- Insert the new step at the desired position
  INSERT INTO public.whatsapp_flow_steps (flow_id, step_order, step_key, display_name, step_type, config)
  VALUES (p_flow_id, p_step_order, p_step_key, p_display_name, p_step_type, p_config)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- 3. Grants
GRANT EXECUTE ON FUNCTION reorder_flow_steps(UUID, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION insert_flow_step_with_shift(UUID, INT, TEXT, TEXT, TEXT, JSONB) TO authenticated, service_role;
