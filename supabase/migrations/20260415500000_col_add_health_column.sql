-- ============================================================================
-- Add health insurance (base_health) column to Cost of Living Calculator
-- Data sources: KFF Employer Health Benefits Survey 2024, Healthcare.gov 2025
-- Base costs = single adult, monthly premium (marketplace benchmark/employer avg)
-- Varies significantly by state (NY/CA/MA highest; TX/FL/UT lowest)
-- ============================================================================

-- Add column with default
ALTER TABLE public.cost_of_living_cities
ADD COLUMN IF NOT EXISTS base_health NUMERIC NOT NULL DEFAULT 0;

-- Set health insurance costs per city (monthly, single adult, moderate plan)
-- Based on ACA marketplace benchmark silver plans + employer contribution averages

-- Original 15 cities
UPDATE public.cost_of_living_cities SET base_health = 580 WHERE slug = 'san-francisco-ca';
UPDATE public.cost_of_living_cities SET base_health = 520 WHERE slug = 'los-angeles-ca';
UPDATE public.cost_of_living_cities SET base_health = 600 WHERE slug = 'new-york-ny';
UPDATE public.cost_of_living_cities SET base_health = 550 WHERE slug = 'boston-ma';
UPDATE public.cost_of_living_cities SET base_health = 480 WHERE slug = 'seattle-wa';
UPDATE public.cost_of_living_cities SET base_health = 440 WHERE slug = 'chicago-il';
UPDATE public.cost_of_living_cities SET base_health = 460 WHERE slug = 'washington-dc';
UPDATE public.cost_of_living_cities SET base_health = 420 WHERE slug = 'miami-fl';
UPDATE public.cost_of_living_cities SET base_health = 380 WHERE slug = 'dallas-tx';
UPDATE public.cost_of_living_cities SET base_health = 370 WHERE slug = 'houston-tx';
UPDATE public.cost_of_living_cities SET base_health = 350 WHERE slug = 'san-antonio-tx';
UPDATE public.cost_of_living_cities SET base_health = 430 WHERE slug = 'atlanta-ga';
UPDATE public.cost_of_living_cities SET base_health = 400 WHERE slug = 'austin-tx';
UPDATE public.cost_of_living_cities SET base_health = 480 WHERE slug = 'newark-nj';
UPDATE public.cost_of_living_cities SET base_health = 410 WHERE slug = 'orlando-fl';

-- 20 new cities
UPDATE public.cost_of_living_cities SET base_health = 450 WHERE slug = 'denver-co';
UPDATE public.cost_of_living_cities SET base_health = 380 WHERE slug = 'phoenix-az';
UPDATE public.cost_of_living_cities SET base_health = 350 WHERE slug = 'las-vegas-nv';
UPDATE public.cost_of_living_cities SET base_health = 400 WHERE slug = 'nashville-tn';
UPDATE public.cost_of_living_cities SET base_health = 420 WHERE slug = 'charlotte-nc';
UPDATE public.cost_of_living_cities SET base_health = 410 WHERE slug = 'raleigh-nc';
UPDATE public.cost_of_living_cities SET base_health = 460 WHERE slug = 'minneapolis-mn';
UPDATE public.cost_of_living_cities SET base_health = 470 WHERE slug = 'portland-or';
UPDATE public.cost_of_living_cities SET base_health = 540 WHERE slug = 'san-diego-ca';
UPDATE public.cost_of_living_cities SET base_health = 410 WHERE slug = 'tampa-fl';
UPDATE public.cost_of_living_cities SET base_health = 400 WHERE slug = 'indianapolis-in';
UPDATE public.cost_of_living_cities SET base_health = 420 WHERE slug = 'columbus-oh';
UPDATE public.cost_of_living_cities SET base_health = 430 WHERE slug = 'detroit-mi';
UPDATE public.cost_of_living_cities SET base_health = 390 WHERE slug = 'salt-lake-city-ut';
UPDATE public.cost_of_living_cities SET base_health = 400 WHERE slug = 'kansas-city-mo';
UPDATE public.cost_of_living_cities SET base_health = 440 WHERE slug = 'pittsburgh-pa';
UPDATE public.cost_of_living_cities SET base_health = 530 WHERE slug = 'sacramento-ca';
UPDATE public.cost_of_living_cities SET base_health = 400 WHERE slug = 'jacksonville-fl';
UPDATE public.cost_of_living_cities SET base_health = 440 WHERE slug = 'milwaukee-wi';

-- Update family multipliers in app_configs to include health
UPDATE public.app_configs
SET value = '{"couple":{"rent":1.2,"food":1.8,"transport":1.5,"health":2.0,"other":1.4},"family":{"rent":1.2,"food":1.8,"transport":1.5,"health":2.0,"other":1.4},"child":{"rent":0.15,"food":0.4,"transport":0.1,"health":0.5,"other":0.2}}'
WHERE key = 'col_family_multipliers';

-- Re-rank ALL cities by total base cost including health
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY (base_rent + base_food + base_transport + base_health + base_other) DESC) AS new_rank
  FROM public.cost_of_living_cities
  WHERE enabled = true
)
UPDATE public.cost_of_living_cities c
SET ranking = r.new_rank
FROM ranked r
WHERE c.id = r.id;
