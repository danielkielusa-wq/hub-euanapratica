-- ════════════════════════════════════════════════════════════════════════
-- Content Calendar Sync — PG trigger + N8N automations
--
-- Fires when production_date or scheduled_for changes on content_pieces.
-- Calls sync-content-calendar Edge Function → N8N → Google Calendar.
-- ════════════════════════════════════════════════════════════════════════

-- ── Trigger function ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_content_date_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only fire if production_date or scheduled_for actually changed
  IF (
    NEW.production_date IS DISTINCT FROM OLD.production_date
    OR (NEW.scheduled_for::date) IS DISTINCT FROM (OLD.scheduled_for::date)
  ) THEN
    PERFORM invoke_edge_function(
      'sync-content-calendar',
      jsonb_build_object(
        'piece_id',            NEW.id,
        'title',               COALESCE(NEW.title, ''),
        'format',              NEW.format,
        'status',              NEW.status,
        'production_date',     NEW.production_date,
        'scheduled_for',       NEW.scheduled_for,
        'old_production_date', OLD.production_date,
        'old_scheduled_for',   OLD.scheduled_for
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- ── Trigger ──────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_content_date_changed ON public.content_pieces;

CREATE TRIGGER trg_content_date_changed
  AFTER UPDATE ON public.content_pieces
  FOR EACH ROW
  EXECUTE FUNCTION notify_content_date_changed();

-- ── N8N Automations (calendar sync) ─────────────────────────────────

INSERT INTO n8n_automations (name, display_name, trigger_event, description, category, enabled, webhook_url)
VALUES
  (
    'content_production_scheduled',
    'Calendario: Gravacao Agendada',
    'content.production_scheduled',
    'Cria/atualiza/remove evento de gravacao no Google Calendar quando production_date muda',
    'notification',
    false,
    NULL
  ),
  (
    'content_publish_scheduled',
    'Calendario: Publicacao Agendada',
    'content.publish_scheduled',
    'Cria/atualiza/remove evento de publicacao no Google Calendar quando scheduled_for muda',
    'notification',
    false,
    NULL
  )
ON CONFLICT (name) DO NOTHING;
