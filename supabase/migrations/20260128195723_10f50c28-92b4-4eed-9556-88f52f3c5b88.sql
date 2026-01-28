-- Add new columns to hub_services for premium design and Stripe integration

-- Ribbon badge (NOVO, POPULAR, EXCLUSIVO)
ALTER TABLE public.hub_services ADD COLUMN IF NOT EXISTS ribbon TEXT;

-- Service type for categorization
ALTER TABLE public.hub_services ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'ai_tool';

-- Numeric price for calculations
ALTER TABLE public.hub_services ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) DEFAULT 0;

-- Custom CTA button text
ALTER TABLE public.hub_services ADD COLUMN IF NOT EXISTS cta_text TEXT DEFAULT 'Acessar Agora';

-- Redirect URL after purchase/access
ALTER TABLE public.hub_services ADD COLUMN IF NOT EXISTS redirect_url TEXT;

-- Optional accent color (hex)
ALTER TABLE public.hub_services ADD COLUMN IF NOT EXISTS accent_color TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.hub_services.ribbon IS 'Display ribbon: NOVO, POPULAR, EXCLUSIVO, or null';
COMMENT ON COLUMN public.hub_services.service_type IS 'Service type: ai_tool, live_mentoring, recorded_course, consulting';
COMMENT ON COLUMN public.hub_services.price IS 'Numeric price for calculations and display';
COMMENT ON COLUMN public.hub_services.cta_text IS 'Custom CTA button text';
COMMENT ON COLUMN public.hub_services.redirect_url IS 'URL to redirect after purchase or for access';
COMMENT ON COLUMN public.hub_services.accent_color IS 'Optional hex color for card accent';