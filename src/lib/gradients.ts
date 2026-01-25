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
