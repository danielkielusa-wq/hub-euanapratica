-- Add unique constraint on user_espacos to prevent duplicates
ALTER TABLE public.user_espacos 
ADD CONSTRAINT user_espacos_user_espaco_unique 
UNIQUE (user_id, espaco_id);

-- Function to sync Hot Seats membership based on plan
CREATE OR REPLACE FUNCTION sync_hot_seats_membership()
RETURNS TRIGGER AS $$
DECLARE
  hot_seats_id UUID := '667b04c4-431f-4a6c-9799-b5b82e770b4b';
  is_premium BOOLEAN;
BEGIN
  -- Determine if plan is premium (pro or vip) and active
  is_premium := NEW.plan_id IN ('pro', 'vip') AND NEW.status = 'active';
  
  IF is_premium THEN
    -- Add to Hot Seats if not already enrolled
    INSERT INTO public.user_espacos (user_id, espaco_id, status, enrolled_by)
    VALUES (NEW.user_id, hot_seats_id, 'active', NULL)
    ON CONFLICT (user_id, espaco_id) DO UPDATE SET status = 'active';
  ELSE
    -- Remove from Hot Seats (set status to cancelled)
    UPDATE public.user_espacos 
    SET status = 'cancelled'
    WHERE user_id = NEW.user_id AND espaco_id = hot_seats_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger that fires after subscription changes
CREATE TRIGGER trg_sync_hot_seats_on_subscription
AFTER INSERT OR UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION sync_hot_seats_membership();

-- Sync existing PRO/VIP users to Hot Seats
INSERT INTO public.user_espacos (user_id, espaco_id, status)
SELECT 
  us.user_id,
  '667b04c4-431f-4a6c-9799-b5b82e770b4b' as espaco_id,
  'active' as status
FROM public.user_subscriptions us
WHERE us.plan_id IN ('pro', 'vip') AND us.status = 'active'
ON CONFLICT (user_id, espaco_id) DO UPDATE SET status = 'active';

-- Remove Free users from Hot Seats (if any)
UPDATE public.user_espacos 
SET status = 'cancelled'
WHERE espaco_id = '667b04c4-431f-4a6c-9799-b5b82e770b4b'
AND user_id NOT IN (
  SELECT user_id FROM public.user_subscriptions 
  WHERE plan_id IN ('pro', 'vip') AND status = 'active'
);