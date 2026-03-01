import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import logoFallback from '@/assets/logo-horizontal.png';

interface PlatformLogos {
  logoHorizontal: string;
  logoSquare: string | null;
  isLoading: boolean;
}

async function fetchLogos() {
  const { data, error } = await supabase
    .from('app_configs')
    .select('key, value')
    .in('key', ['platform_logo_horizontal', 'platform_logo_square']);

  if (error) throw error;

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.value) map[row.key] = row.value;
  }

  return {
    horizontal: map['platform_logo_horizontal'] || null,
    square: map['platform_logo_square'] || null,
  };
}

export function usePlatformLogo(): PlatformLogos {
  const { data, isLoading } = useQuery({
    queryKey: ['platform-logos'],
    queryFn: fetchLogos,
    staleTime: 10 * 60 * 1000, // 10 min cache
  });

  return {
    logoHorizontal: data?.horizontal || logoFallback,
    logoSquare: data?.square || null,
    isLoading,
  };
}
