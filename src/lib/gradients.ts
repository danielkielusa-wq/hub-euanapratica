// Brand gradients for Espaço covers fallback
export const ESPACO_GRADIENTS = [
  'linear-gradient(135deg, hsl(234, 85%, 66%) 0%, hsl(271, 41%, 53%) 100%)', // Purple/Indigo
  'linear-gradient(135deg, hsl(308, 95%, 78%) 0%, hsl(355, 87%, 65%) 100%)', // Pink/Coral
  'linear-gradient(135deg, hsl(207, 99%, 65%) 0%, hsl(180, 100%, 50%) 100%)', // Blue/Cyan
  'linear-gradient(135deg, hsl(143, 75%, 58%) 0%, hsl(168, 93%, 60%) 100%)', // Green/Turquoise
  'linear-gradient(135deg, hsl(345, 94%, 73%) 0%, hsl(47, 99%, 63%) 100%)', // Pink/Yellow
];

export const getEspacoGradient = (id: string): string => {
  const index = id.charCodeAt(0) % ESPACO_GRADIENTS.length;
  return ESPACO_GRADIENTS[index];
};

// Premium Gradient Presets for Visual Customization
export const GRADIENT_PRESETS = {
  sunrise: {
    name: 'Sunrise Serenity',
    colors: ['#FF9A8B', '#FF6A88', '#D4A5FF'],
    css: 'linear-gradient(135deg, #FF9A8B 0%, #FF6A88 50%, #D4A5FF 100%)'
  },
  ocean: {
    name: 'Ocean Whisper',
    colors: ['#2193b0', '#6dd5ed'],
    css: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)'
  },
  mystic: {
    name: 'Mystic Dusk',
    colors: ['#4b6cb7', '#182848'],
    css: 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)'
  },
  emerald: {
    name: 'Emerald Grove',
    colors: ['#11998e', '#38ef7d'],
    css: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
  },
  volcanic: {
    name: 'Volcanic Ember',
    colors: ['#e65c00', '#F9D423'],
    css: 'linear-gradient(135deg, #e65c00 0%, #F9D423 100%)'
  },
  slate: {
    name: 'Slate Monochrome',
    colors: ['#0F172A', '#334155', '#0F172A'],
    css: 'linear-gradient(135deg, #0F172A 0%, #334155 50%, #0F172A 100%)'
  }
} as const;

export type GradientPresetKey = keyof typeof GRADIENT_PRESETS;

/**
 * Resolve gradient from preset, custom colors, or fallback to ID-based gradient
 */
export function resolveGradient(
  preset?: string | null,
  gradientStart?: string | null,
  gradientEnd?: string | null,
  fallbackId?: string
): string {
  // Priority 1: Named preset
  if (preset && preset in GRADIENT_PRESETS) {
    return GRADIENT_PRESETS[preset as GradientPresetKey].css;
  }
  
  // Priority 2: Custom start/end colors
  if (gradientStart && gradientEnd) {
    return `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`;
  }
  
  // Priority 3: Fallback based on ID
  if (fallbackId) {
    return getEspacoGradient(fallbackId);
  }
  
  // Default fallback
  return ESPACO_GRADIENTS[0];
}

/**
 * Get preset info by key
 */
export function getPresetInfo(key: GradientPresetKey) {
  return GRADIENT_PRESETS[key];
}

/**
 * Check if a string is a valid preset key
 */
export function isValidPreset(value: string): value is GradientPresetKey {
  return value in GRADIENT_PRESETS;
}
