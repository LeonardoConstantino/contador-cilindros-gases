export interface GasPreset {
  label: string;
  category: 'Medicinal' | 'Industrial' | 'Especial' | 'Outro';
  colorTag: string; // Hex color code for standard cylinder identification
  accentClass: string; // Tailwind border/badge color
  bgClass: string;
  defaultMinStock?: number;
}

export const POPULAR_GASES: GasPreset[] = [
  {
    label: 'Oxigênio Medicinal',
    category: 'Medicinal',
    colorTag: '#10b981', // Verde
    accentClass: 'border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40',
    bgClass: 'bg-emerald-500',
    defaultMinStock: 3,
  },
  {
    label: 'Argônio Industrial',
    category: 'Industrial',
    colorTag: '#b45309', // Marrom
    accentClass: 'border-amber-700 text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40',
    bgClass: 'bg-amber-700',
    defaultMinStock: 2,
  },
  {
    label: 'Acetileno',
    category: 'Industrial',
    colorTag: '#dc2626', // Bordô/Vermelho
    accentClass: 'border-red-600 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40',
    bgClass: 'bg-red-600',
    defaultMinStock: 2,
  },
  {
    label: 'Dióxido de Carbono (CO₂)',
    category: 'Industrial',
    colorTag: '#334155', // Preto/Cinza grafite
    accentClass: 'border-slate-600 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60',
    bgClass: 'bg-slate-700',
    defaultMinStock: 2,
  },
  {
    label: 'Nitrogênio',
    category: 'Industrial',
    colorTag: '#64748b', // Cinza médio
    accentClass: 'border-slate-500 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40',
    bgClass: 'bg-slate-500',
    defaultMinStock: 2,
  },
  {
    label: 'Mistura MIG/MAG (Ar+CO₂)',
    category: 'Industrial',
    colorTag: '#0284c7', // Azul petróleo
    accentClass: 'border-sky-600 text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40',
    bgClass: 'bg-sky-600',
    defaultMinStock: 2,
  },
  {
    label: 'Hélio',
    category: 'Especial',
    colorTag: '#ea580c', // Laranja
    accentClass: 'border-orange-500 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40',
    bgClass: 'bg-orange-500',
    defaultMinStock: 1,
  },
  {
    label: 'Ar Comprimido / Medicinal',
    category: 'Medicinal',
    colorTag: '#ca8a04', // Amarelo
    accentClass: 'border-yellow-500 text-yellow-800 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/40',
    bgClass: 'bg-yellow-500',
    defaultMinStock: 2,
  },
];
