-- ============================================================================
-- Cost of Living Calculator
-- Tables, RLS, grants, and seed data for 15 US cities
-- ============================================================================

-- 1. Cities table
CREATE TABLE public.cost_of_living_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name TEXT NOT NULL,
  state_code TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  latitude NUMERIC(9,6) NOT NULL,
  longitude NUMERIC(10,6) NOT NULL,
  -- Base monthly costs (single adult, moderate lifestyle, USD)
  base_rent NUMERIC(8,2) NOT NULL,
  base_food NUMERIC(8,2) NOT NULL,
  base_transport NUMERIC(8,2) NOT NULL,
  base_other NUMERIC(8,2) NOT NULL,
  -- Salaries by professional field (JSONB)
  salaries_by_field JSONB NOT NULL DEFAULT '{}',
  -- Metadata
  ranking INTEGER,
  cheaper_alternative TEXT,
  cheaper_alternative_pct INTEGER,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Leads table
CREATE TABLE public.cost_of_living_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT NOT NULL,
  city_slug TEXT REFERENCES public.cost_of_living_cities(slug),
  salary INTEGER,
  family_size TEXT,
  children INTEGER DEFAULT 0,
  lifestyle TEXT,
  field TEXT,
  result_leftover INTEGER,
  result_coverage INTEGER,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add source tracking to career_evaluations
ALTER TABLE public.career_evaluations
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS source_metadata JSONB;

-- ============================================================================
-- RLS
-- ============================================================================
ALTER TABLE public.cost_of_living_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_of_living_leads ENABLE ROW LEVEL SECURITY;

-- Cities: anyone can read enabled cities
CREATE POLICY "Anyone can read enabled cities"
  ON public.cost_of_living_cities FOR SELECT
  USING (enabled = true);

-- Cities: admins can do everything
CREATE POLICY "Admins manage cities"
  ON public.cost_of_living_cities FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Leads: anyone can insert (public form)
CREATE POLICY "Anyone can insert leads"
  ON public.cost_of_living_leads FOR INSERT
  WITH CHECK (true);

-- Leads: admins can read/update/delete
CREATE POLICY "Admins manage leads"
  ON public.cost_of_living_leads FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- GRANTs
-- ============================================================================
GRANT SELECT ON public.cost_of_living_cities TO anon, authenticated;
GRANT ALL ON public.cost_of_living_cities TO service_role;
GRANT INSERT ON public.cost_of_living_leads TO anon;
GRANT ALL ON public.cost_of_living_leads TO authenticated, service_role;

-- ============================================================================
-- App configs (multipliers, fields, São Paulo baseline)
-- ============================================================================
INSERT INTO public.app_configs (key, value, description) VALUES
  ('col_family_multipliers', '{
    "couple": {"rent": 1.2, "food": 1.8, "transport": 1.5, "other": 1.4},
    "family": {"rent": 1.2, "food": 1.8, "transport": 1.5, "other": 1.4},
    "child": {"rent": 0.15, "food": 0.4, "transport": 0.1, "other": 0.2}
  }', 'Multiplicadores familiares da Calculadora de Custo de Vida'),
  ('col_lifestyle_multipliers', '{
    "economic": 0.85,
    "moderate": 1.0,
    "high": 1.3
  }', 'Multiplicadores de estilo de vida da Calculadora de Custo de Vida'),
  ('col_fields', '["Tech", "Healthcare", "Finance", "Engineering", "Marketing", "Education", "Sales", "Hospitality"]',
    'Áreas profissionais disponíveis na Calculadora de Custo de Vida'),
  ('col_sao_paulo_baseline', '{
    "rent": 600, "food": 350, "transport": 100, "other": 150
  }', 'Custos base mensais de São Paulo em USD para comparativo')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- Seed: 15 US cities (BLS Consumer Expenditure + OES data, 2025)
-- Base costs = single adult, moderate lifestyle, monthly USD
-- Salaries = annual median by field
-- ============================================================================
INSERT INTO public.cost_of_living_cities
  (city_name, state_code, slug, latitude, longitude, base_rent, base_food, base_transport, base_other, salaries_by_field, ranking, cheaper_alternative, cheaper_alternative_pct)
VALUES
  ('Miami', 'FL', 'miami-fl', 25.7617, -80.1918,
    2100, 650, 580, 420,
    '{"Tech": 85000, "Healthcare": 62000, "Finance": 78000, "Engineering": 82000, "Marketing": 60000, "Education": 48000, "Sales": 55000, "Hospitality": 38000}',
    8, 'orlando-fl', 22),

  ('Orlando', 'FL', 'orlando-fl', 28.5383, -81.3792,
    1600, 550, 520, 350,
    '{"Tech": 82000, "Healthcare": 58000, "Finance": 70000, "Engineering": 78000, "Marketing": 55000, "Education": 46000, "Sales": 50000, "Hospitality": 36000}',
    15, 'atlanta-ga', 12),

  ('Houston', 'TX', 'houston-tx', 29.7604, -95.3698,
    1450, 520, 540, 380,
    '{"Tech": 92000, "Healthcare": 65000, "Finance": 82000, "Engineering": 95000, "Marketing": 58000, "Education": 50000, "Sales": 56000, "Hospitality": 35000}',
    18, 'san-antonio-tx', 18),

  ('Dallas', 'TX', 'dallas-tx', 32.7767, -96.7970,
    1550, 530, 530, 370,
    '{"Tech": 95000, "Healthcare": 63000, "Finance": 80000, "Engineering": 90000, "Marketing": 60000, "Education": 49000, "Sales": 58000, "Hospitality": 36000}',
    16, 'houston-tx', 8),

  ('Austin', 'TX', 'austin-tx', 30.2672, -97.7431,
    1700, 560, 490, 380,
    '{"Tech": 105000, "Healthcare": 64000, "Finance": 78000, "Engineering": 92000, "Marketing": 62000, "Education": 50000, "Sales": 58000, "Hospitality": 37000}',
    13, 'houston-tx', 15),

  ('San Antonio', 'TX', 'san-antonio-tx', 29.4241, -98.4936,
    1200, 480, 470, 320,
    '{"Tech": 78000, "Healthcare": 58000, "Finance": 65000, "Engineering": 75000, "Marketing": 50000, "Education": 45000, "Sales": 48000, "Hospitality": 33000}',
    22, NULL, NULL),

  ('Atlanta', 'GA', 'atlanta-ga', 33.7490, -84.3880,
    1550, 520, 510, 360,
    '{"Tech": 95000, "Healthcare": 63000, "Finance": 80000, "Engineering": 88000, "Marketing": 60000, "Education": 49000, "Sales": 56000, "Hospitality": 36000}',
    14, 'san-antonio-tx', 20),

  ('Boston', 'MA', 'boston-ma', 42.3601, -71.0589,
    2400, 680, 550, 480,
    '{"Tech": 115000, "Healthcare": 75000, "Finance": 95000, "Engineering": 100000, "Marketing": 68000, "Education": 58000, "Sales": 65000, "Hospitality": 40000}',
    5, 'philadelphia-pa', 25),

  ('Newark', 'NJ', 'newark-nj', 40.7357, -74.1724,
    1800, 620, 520, 420,
    '{"Tech": 110000, "Healthcare": 72000, "Finance": 95000, "Engineering": 98000, "Marketing": 65000, "Education": 55000, "Sales": 62000, "Hospitality": 38000}',
    9, 'philadelphia-pa', 18),

  ('Philadelphia', 'PA', 'philadelphia-pa', 39.9526, -75.1652,
    1500, 530, 480, 350,
    '{"Tech": 90000, "Healthcare": 65000, "Finance": 78000, "Engineering": 85000, "Marketing": 58000, "Education": 50000, "Sales": 55000, "Hospitality": 36000}',
    17, 'atlanta-ga', 5),

  ('Los Angeles', 'CA', 'los-angeles-ca', 34.0522, -118.2437,
    2300, 680, 620, 480,
    '{"Tech": 115000, "Healthcare": 72000, "Finance": 88000, "Engineering": 100000, "Marketing": 65000, "Education": 55000, "Sales": 62000, "Hospitality": 40000}',
    4, 'phoenix-az', 35),

  ('San Francisco', 'CA', 'san-francisco-ca', 37.7749, -122.4194,
    2800, 750, 550, 550,
    '{"Tech": 140000, "Healthcare": 82000, "Finance": 105000, "Engineering": 120000, "Marketing": 75000, "Education": 62000, "Sales": 72000, "Hospitality": 42000}',
    2, 'austin-tx', 30),

  ('Seattle', 'WA', 'seattle-wa', 47.6062, -122.3321,
    2200, 650, 520, 460,
    '{"Tech": 130000, "Healthcare": 75000, "Finance": 90000, "Engineering": 110000, "Marketing": 68000, "Education": 55000, "Sales": 65000, "Hospitality": 40000}',
    6, 'austin-tx', 18),

  ('Chicago', 'IL', 'chicago-il', 41.8781, -87.6298,
    1700, 580, 520, 400,
    '{"Tech": 98000, "Healthcare": 65000, "Finance": 85000, "Engineering": 90000, "Marketing": 60000, "Education": 52000, "Sales": 58000, "Hospitality": 37000}',
    11, 'philadelphia-pa', 12),

  ('Washington', 'DC', 'washington-dc', 38.9072, -77.0369,
    2200, 650, 530, 460,
    '{"Tech": 115000, "Healthcare": 72000, "Finance": 95000, "Engineering": 100000, "Marketing": 68000, "Education": 58000, "Sales": 65000, "Hospitality": 40000}',
    7, 'atlanta-ga', 25);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_col_cities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_col_cities_updated_at
  BEFORE UPDATE ON public.cost_of_living_cities
  FOR EACH ROW EXECUTE FUNCTION update_col_cities_updated_at();
