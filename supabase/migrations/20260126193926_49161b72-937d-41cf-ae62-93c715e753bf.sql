-- Add gradient theme columns to espacos table
ALTER TABLE public.espacos 
ADD COLUMN IF NOT EXISTS gradient_preset TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS gradient_start TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS gradient_end TEXT DEFAULT NULL;

-- Add gradient theme columns to sessions table for session-specific styling
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS gradient_preset TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS gradient_start TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS gradient_end TEXT DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.espacos.gradient_preset IS 'Preset gradient theme name (sunrise, ocean, mystic, emerald, volcanic, slate)';
COMMENT ON COLUMN public.espacos.gradient_start IS 'Custom gradient start color (hex)';
COMMENT ON COLUMN public.espacos.gradient_end IS 'Custom gradient end color (hex)';
COMMENT ON COLUMN public.sessions.gradient_preset IS 'Preset gradient theme name for session-specific styling';
COMMENT ON COLUMN public.sessions.gradient_start IS 'Custom gradient start color (hex)';
COMMENT ON COLUMN public.sessions.gradient_end IS 'Custom gradient end color (hex)';