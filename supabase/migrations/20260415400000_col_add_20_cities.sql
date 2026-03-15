-- ============================================================================
-- Add 20 more US cities to Cost of Living Calculator
-- Data sources: Zumper/Rentometer 2025, BLS OES May 2024, Numbeo CoL 2025
-- Base costs = single adult, moderate lifestyle, monthly USD
-- Salaries = annual median by field
-- ============================================================================

-- First, re-rank existing cities to make room for new ones
-- New ranking order by total base cost (rent+food+transport+other):
-- 1 NYC 4580, 2 SF 4650→2 kept, 3 SD 3880, 4 LA 4080→kept, 5 BOS 4110→kept,
-- We'll set all rankings in a single UPDATE at the end.

INSERT INTO public.cost_of_living_cities
  (city_name, state_code, slug, latitude, longitude, base_rent, base_food, base_transport, base_other, salaries_by_field, ranking, cheaper_alternative, cheaper_alternative_pct)
VALUES
  ('New York City', 'NY', 'new-york-ny', 40.7128, -74.0060,
    2700, 750, 580, 550,
    '{"Tech": 135000, "Healthcare": 80000, "Finance": 105000, "Engineering": 110000, "Marketing": 72000, "Education": 62000, "Sales": 70000, "Hospitality": 42000}',
    NULL, 'newark-nj', 28),

  ('Denver', 'CO', 'denver-co', 39.7392, -104.9903,
    1650, 580, 520, 410,
    '{"Tech": 105000, "Healthcare": 68000, "Finance": 82000, "Engineering": 92000, "Marketing": 62000, "Education": 52000, "Sales": 60000, "Hospitality": 38000}',
    NULL, 'kansas-city-mo', 28),

  ('Phoenix', 'AZ', 'phoenix-az', 33.4484, -112.0740,
    1380, 520, 510, 360,
    '{"Tech": 88000, "Healthcare": 62000, "Finance": 72000, "Engineering": 82000, "Marketing": 55000, "Education": 48000, "Sales": 54000, "Hospitality": 35000}',
    NULL, 'san-antonio-tx', 12),

  ('Las Vegas', 'NV', 'las-vegas-nv', 36.1699, -115.1398,
    1300, 510, 500, 350,
    '{"Tech": 80000, "Healthcare": 62000, "Finance": 68000, "Engineering": 78000, "Marketing": 52000, "Education": 46000, "Sales": 52000, "Hospitality": 40000}',
    NULL, 'san-antonio-tx', 8),

  ('Nashville', 'TN', 'nashville-tn', 36.1627, -86.7816,
    1560, 540, 510, 370,
    '{"Tech": 90000, "Healthcare": 63000, "Finance": 75000, "Engineering": 82000, "Marketing": 58000, "Education": 48000, "Sales": 56000, "Hospitality": 37000}',
    NULL, 'indianapolis-in', 22),

  ('Charlotte', 'NC', 'charlotte-nc', 35.2271, -80.8431,
    1500, 530, 500, 360,
    '{"Tech": 92000, "Healthcare": 64000, "Finance": 82000, "Engineering": 85000, "Marketing": 58000, "Education": 48000, "Sales": 56000, "Hospitality": 35000}',
    NULL, 'indianapolis-in', 18),

  ('Raleigh', 'NC', 'raleigh-nc', 35.7796, -78.6382,
    1390, 510, 490, 350,
    '{"Tech": 95000, "Healthcare": 62000, "Finance": 74000, "Engineering": 85000, "Marketing": 56000, "Education": 48000, "Sales": 54000, "Hospitality": 34000}',
    NULL, 'jacksonville-fl', 12),

  ('Minneapolis', 'MN', 'minneapolis-mn', 44.9778, -93.2650,
    1500, 540, 510, 380,
    '{"Tech": 95000, "Healthcare": 68000, "Finance": 80000, "Engineering": 88000, "Marketing": 60000, "Education": 52000, "Sales": 58000, "Hospitality": 36000}',
    NULL, 'indianapolis-in', 18),

  ('Portland', 'OR', 'portland-or', 45.5152, -122.6784,
    1600, 580, 510, 410,
    '{"Tech": 105000, "Healthcare": 70000, "Finance": 78000, "Engineering": 90000, "Marketing": 60000, "Education": 52000, "Sales": 58000, "Hospitality": 38000}',
    NULL, 'indianapolis-in', 22),

  ('San Diego', 'CA', 'san-diego-ca', 32.7157, -117.1611,
    2200, 660, 560, 460,
    '{"Tech": 115000, "Healthcare": 72000, "Finance": 85000, "Engineering": 98000, "Marketing": 65000, "Education": 55000, "Sales": 62000, "Hospitality": 40000}',
    NULL, 'phoenix-az', 30),

  ('Tampa', 'FL', 'tampa-fl', 27.9506, -82.4572,
    1550, 530, 510, 360,
    '{"Tech": 85000, "Healthcare": 60000, "Finance": 72000, "Engineering": 80000, "Marketing": 55000, "Education": 47000, "Sales": 52000, "Hospitality": 36000}',
    NULL, 'jacksonville-fl', 15),

  ('Indianapolis', 'IN', 'indianapolis-in', 39.7684, -86.1581,
    1150, 480, 470, 320,
    '{"Tech": 80000, "Healthcare": 60000, "Finance": 68000, "Engineering": 78000, "Marketing": 50000, "Education": 46000, "Sales": 50000, "Hospitality": 33000}',
    NULL, NULL, NULL),

  ('Columbus', 'OH', 'columbus-oh', 39.9612, -82.9988,
    1210, 490, 470, 330,
    '{"Tech": 82000, "Healthcare": 60000, "Finance": 70000, "Engineering": 78000, "Marketing": 52000, "Education": 46000, "Sales": 52000, "Hospitality": 34000}',
    NULL, 'indianapolis-in', 8),

  ('Detroit', 'MI', 'detroit-mi', 42.3314, -83.0458,
    1050, 470, 490, 320,
    '{"Tech": 82000, "Healthcare": 62000, "Finance": 72000, "Engineering": 82000, "Marketing": 52000, "Education": 48000, "Sales": 50000, "Hospitality": 33000}',
    NULL, NULL, NULL),

  ('Salt Lake City', 'UT', 'salt-lake-city-ut', 40.7608, -111.8910,
    1430, 520, 490, 360,
    '{"Tech": 90000, "Healthcare": 62000, "Finance": 72000, "Engineering": 82000, "Marketing": 55000, "Education": 48000, "Sales": 55000, "Hospitality": 35000}',
    NULL, 'phoenix-az', 8),

  ('Kansas City', 'MO', 'kansas-city-mo', 39.0997, -94.5786,
    1150, 480, 470, 320,
    '{"Tech": 82000, "Healthcare": 60000, "Finance": 70000, "Engineering": 78000, "Marketing": 52000, "Education": 46000, "Sales": 50000, "Hospitality": 33000}',
    NULL, NULL, NULL),

  ('Pittsburgh', 'PA', 'pittsburgh-pa', 40.4406, -79.9959,
    1300, 500, 480, 340,
    '{"Tech": 85000, "Healthcare": 62000, "Finance": 75000, "Engineering": 82000, "Marketing": 55000, "Education": 48000, "Sales": 54000, "Hospitality": 35000}',
    NULL, 'indianapolis-in', 12),

  ('Sacramento', 'CA', 'sacramento-ca', 38.5816, -121.4944,
    1650, 570, 530, 400,
    '{"Tech": 100000, "Healthcare": 68000, "Finance": 78000, "Engineering": 88000, "Marketing": 58000, "Education": 52000, "Sales": 58000, "Hospitality": 37000}',
    NULL, 'phoenix-az', 22),

  ('Jacksonville', 'FL', 'jacksonville-fl', 30.3322, -81.6557,
    1310, 500, 490, 340,
    '{"Tech": 80000, "Healthcare": 58000, "Finance": 68000, "Engineering": 76000, "Marketing": 52000, "Education": 45000, "Sales": 50000, "Hospitality": 34000}',
    NULL, 'san-antonio-tx', 8),

  ('Milwaukee', 'WI', 'milwaukee-wi', 43.0389, -87.9065,
    1200, 490, 480, 330,
    '{"Tech": 82000, "Healthcare": 62000, "Finance": 70000, "Engineering": 80000, "Marketing": 52000, "Education": 48000, "Sales": 52000, "Hospitality": 34000}',
    NULL, 'indianapolis-in', 5);

-- Now that phoenix-az exists, restore LA's original cheaper alternative
UPDATE public.cost_of_living_cities
SET cheaper_alternative = 'phoenix-az', cheaper_alternative_pct = 35
WHERE slug = 'los-angeles-ca';

-- Re-rank ALL cities by total base cost (descending = most expensive first)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY (base_rent + base_food + base_transport + base_other) DESC) AS new_rank
  FROM public.cost_of_living_cities
  WHERE enabled = true
)
UPDATE public.cost_of_living_cities c
SET ranking = r.new_rank
FROM ranked r
WHERE c.id = r.id;
