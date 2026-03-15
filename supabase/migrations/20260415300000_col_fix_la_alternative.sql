-- Fix: LA referenced phoenix-az as cheaper alternative, but Phoenix is not in our cities list
-- Changed to dallas-tx which exists and is ~30% cheaper
UPDATE public.cost_of_living_cities
SET cheaper_alternative = 'dallas-tx', cheaper_alternative_pct = 30
WHERE slug = 'los-angeles-ca';
