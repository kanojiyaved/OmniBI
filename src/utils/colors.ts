export const PALETTES = {
  vibrant: ['#0284c7', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'],
  ocean: ['#0369a1', '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#0284c7'],
  emerald: ['#047857', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#059669'],
  sunset: ['#ea580c', '#f97316', '#fb923c', '#f59e0b', '#fbbf24', '#e11d48'],
  cyberpunk: ['#ec4899', '#8b5cf6', '#06b6d4', '#3b82f6', '#10b981', '#f43f5e'],
};

export const getChartColor = (index: number, paletteName: keyof typeof PALETTES = 'vibrant'): string => {
  const palette = PALETTES[paletteName] || PALETTES.vibrant;
  return palette[index % palette.length];
};
