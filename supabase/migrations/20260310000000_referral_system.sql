-- ============================================================================
-- Referral System: Viral Loop on Report
-- Leads share their report link; when 3 friends complete the diagnostic,
-- the referrer gets full report access unlocked.
-- ============================================================================

-- 1. Add referral columns to career_evaluations
ALTER TABLE public.career_evaluations
  ADD COLUMN IF NOT EXISTS referral_code VARCHAR(12) UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by_code VARCHAR(12),
  ADD COLUMN IF NOT EXISTS referral_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_unlocked BOOLEAN NOT NULL DEFAULT false;

-- 2. Populate referral_code for existing records (first 8 chars of access_token, uppercased)
UPDATE public.career_evaluations
SET referral_code = UPPER(LEFT(access_token::text, 8))
WHERE referral_code IS NULL AND access_token IS NOT NULL;

-- 3. Trigger: auto-generate referral_code on INSERT
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL AND NEW.access_token IS NOT NULL THEN
    NEW.referral_code := UPPER(LEFT(NEW.access_token::text, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_referral_code ON public.career_evaluations;
CREATE TRIGGER trg_generate_referral_code
  BEFORE INSERT ON public.career_evaluations
  FOR EACH ROW EXECUTE FUNCTION generate_referral_code();

-- 4. Trigger: increment referral_count when a new lead has referred_by_code
CREATE OR REPLACE FUNCTION update_referral_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referred_by_code IS NOT NULL THEN
    UPDATE public.career_evaluations
    SET referral_count = referral_count + 1,
        referral_unlocked = CASE
          WHEN referral_count + 1 >= 3 THEN true
          ELSE referral_unlocked
        END
    WHERE referral_code = NEW.referred_by_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_referral_count ON public.career_evaluations;
CREATE TRIGGER trg_update_referral_count
  AFTER INSERT ON public.career_evaluations
  FOR EACH ROW EXECUTE FUNCTION update_referral_count();

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_ce_referral_code ON public.career_evaluations(referral_code);
CREATE INDEX IF NOT EXISTS idx_ce_referred_by ON public.career_evaluations(referred_by_code);

-- 6. Grants (ensure both authenticated and service_role have access)
GRANT ALL ON public.career_evaluations TO authenticated, service_role;
