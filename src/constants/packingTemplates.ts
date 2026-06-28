import type { PackingCategory } from '@/types/packing';
import type { PackingSeed } from '@/services/packing';

export type PackingTemplateItem = {
  name: string;
  category: PackingCategory;
};

export type PackingTemplate = {
  name: string;
  items: PackingTemplateItem[];
};

export type PackingTemplateKey = 'common' | 'beach' | 'mountain' | 'city' | 'business';

export const PACKING_TEMPLATES: Record<PackingTemplateKey, PackingTemplate> = {
  common: {
    name: 'Básicos (siempre)',
    items: [
      { name: 'DNI / Pasaporte', category: 'docs' },
      { name: 'Tarjeta de crédito/débito', category: 'docs' },
      { name: 'Dinero en efectivo', category: 'docs' },
      { name: 'Cargador del móvil', category: 'tech' },
      { name: 'Power bank', category: 'tech' },
      { name: 'Auriculares', category: 'tech' },
      { name: 'Cepillo y pasta de dientes', category: 'hygiene' },
      { name: 'Desodorante', category: 'hygiene' },
      { name: 'Gel y champú', category: 'hygiene' },
      { name: 'Ropa interior', category: 'clothes' },
      { name: 'Calcetines', category: 'clothes' },
      { name: 'Pijama', category: 'clothes' },
      { name: 'Medicación habitual', category: 'other' },
      { name: 'Gafas / lentillas', category: 'other' },
    ],
  },
  beach: {
    name: 'Playa',
    items: [
      { name: 'Bañador', category: 'clothes' },
      { name: 'Chanclas', category: 'clothes' },
      { name: 'Sombrero o gorra', category: 'clothes' },
      { name: 'Toalla de playa', category: 'other' },
      { name: 'Gafas de sol', category: 'other' },
      { name: 'Crema solar', category: 'hygiene' },
      { name: 'After sun', category: 'hygiene' },
    ],
  },
  mountain: {
    name: 'Montaña',
    items: [
      { name: 'Botas de trekking', category: 'clothes' },
      { name: 'Calcetines técnicos', category: 'clothes' },
      { name: 'Cortavientos / impermeable', category: 'clothes' },
      { name: 'Forro polar', category: 'clothes' },
      { name: 'Gorro y guantes', category: 'clothes' },
      { name: 'Linterna frontal', category: 'tech' },
      { name: 'Botiquín básico', category: 'other' },
      { name: 'Bastones de senderismo', category: 'other' },
      { name: 'Cantimplora / botella', category: 'other' },
    ],
  },
  city: {
    name: 'Ciudad',
    items: [
      { name: 'Zapatillas cómodas', category: 'clothes' },
      { name: 'Mochila pequeña', category: 'other' },
      { name: 'Power bank', category: 'tech' },
      { name: 'Adaptador de enchufe', category: 'tech' },
      { name: 'Paraguas plegable', category: 'other' },
      { name: 'Botella reutilizable', category: 'other' },
    ],
  },
  business: {
    name: 'Negocios',
    items: [
      { name: 'Traje / blazer', category: 'clothes' },
      { name: 'Camisas planchadas', category: 'clothes' },
      { name: 'Zapatos de vestir', category: 'clothes' },
      { name: 'Corbata', category: 'clothes' },
      { name: 'Portátil', category: 'tech' },
      { name: 'Cargador del portátil', category: 'tech' },
      { name: 'Documentos de trabajo', category: 'docs' },
      { name: 'Tarjetas de visita', category: 'docs' },
      { name: 'Cuaderno y bolígrafo', category: 'other' },
    ],
  },
};

export function buildSeedsFromTemplates(keys: PackingTemplateKey[]): PackingSeed[] {
  const seen = new Set<string>();
  const seeds: PackingSeed[] = [];

  for (const key of keys) {
    for (const item of PACKING_TEMPLATES[key].items) {
      const norm = item.name.trim().toLowerCase();
      if (seen.has(norm)) continue;
      seen.add(norm);
      seeds.push({ name: item.name, category: item.category });
    }
  }

  return seeds;
}
