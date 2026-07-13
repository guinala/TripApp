import type { PackingCategory } from '@/types/packing';
import type { PackingSeed } from '@/services/packing';
import i18n from '@/i18n';

export type PackingTemplateItem = {
  // Clave i18n del nombre del ítem; se resuelve al idioma activo al aplicar.
  nameKey: string;
  category: PackingCategory;
};

export type PackingTemplate = {
  // Clave i18n del nombre visible de la plantilla.
  nameKey: string;
  items: PackingTemplateItem[];
};

export type PackingTemplateKey = 'common' | 'beach' | 'mountain' | 'city' | 'business';

export const PACKING_TEMPLATES: Record<PackingTemplateKey, PackingTemplate> = {
  common: {
    nameKey: 'packing.templatesData.common.name',
    items: [
      { nameKey: 'packing.templatesData.common.items.id', category: 'docs' },
      { nameKey: 'packing.templatesData.common.items.card', category: 'docs' },
      { nameKey: 'packing.templatesData.common.items.cash', category: 'docs' },
      { nameKey: 'packing.templatesData.common.items.phoneCharger', category: 'tech' },
      { nameKey: 'packing.templatesData.common.items.powerBank', category: 'tech' },
      { nameKey: 'packing.templatesData.common.items.headphones', category: 'tech' },
      { nameKey: 'packing.templatesData.common.items.toothbrush', category: 'hygiene' },
      { nameKey: 'packing.templatesData.common.items.deodorant', category: 'hygiene' },
      { nameKey: 'packing.templatesData.common.items.shampoo', category: 'hygiene' },
      { nameKey: 'packing.templatesData.common.items.underwear', category: 'clothes' },
      { nameKey: 'packing.templatesData.common.items.socks', category: 'clothes' },
      { nameKey: 'packing.templatesData.common.items.pajamas', category: 'clothes' },
      { nameKey: 'packing.templatesData.common.items.medication', category: 'other' },
      { nameKey: 'packing.templatesData.common.items.glasses', category: 'other' },
    ],
  },
  beach: {
    nameKey: 'packing.templatesData.beach.name',
    items: [
      { nameKey: 'packing.templatesData.beach.items.swimsuit', category: 'clothes' },
      { nameKey: 'packing.templatesData.beach.items.flipFlops', category: 'clothes' },
      { nameKey: 'packing.templatesData.beach.items.hat', category: 'clothes' },
      { nameKey: 'packing.templatesData.beach.items.towel', category: 'other' },
      { nameKey: 'packing.templatesData.beach.items.sunglasses', category: 'other' },
      { nameKey: 'packing.templatesData.beach.items.sunscreen', category: 'hygiene' },
      { nameKey: 'packing.templatesData.beach.items.afterSun', category: 'hygiene' },
    ],
  },
  mountain: {
    nameKey: 'packing.templatesData.mountain.name',
    items: [
      { nameKey: 'packing.templatesData.mountain.items.boots', category: 'clothes' },
      { nameKey: 'packing.templatesData.mountain.items.technicalSocks', category: 'clothes' },
      { nameKey: 'packing.templatesData.mountain.items.windbreaker', category: 'clothes' },
      { nameKey: 'packing.templatesData.mountain.items.fleece', category: 'clothes' },
      { nameKey: 'packing.templatesData.mountain.items.hatGloves', category: 'clothes' },
      { nameKey: 'packing.templatesData.mountain.items.headlamp', category: 'tech' },
      { nameKey: 'packing.templatesData.mountain.items.firstAid', category: 'other' },
      { nameKey: 'packing.templatesData.mountain.items.poles', category: 'other' },
      { nameKey: 'packing.templatesData.mountain.items.bottle', category: 'other' },
    ],
  },
  city: {
    nameKey: 'packing.templatesData.city.name',
    items: [
      { nameKey: 'packing.templatesData.city.items.sneakers', category: 'clothes' },
      { nameKey: 'packing.templatesData.city.items.backpack', category: 'other' },
      { nameKey: 'packing.templatesData.city.items.powerBank', category: 'tech' },
      { nameKey: 'packing.templatesData.city.items.adapter', category: 'tech' },
      { nameKey: 'packing.templatesData.city.items.umbrella', category: 'other' },
      { nameKey: 'packing.templatesData.city.items.bottle', category: 'other' },
    ],
  },
  business: {
    nameKey: 'packing.templatesData.business.name',
    items: [
      { nameKey: 'packing.templatesData.business.items.suit', category: 'clothes' },
      { nameKey: 'packing.templatesData.business.items.shirts', category: 'clothes' },
      { nameKey: 'packing.templatesData.business.items.dressShoes', category: 'clothes' },
      { nameKey: 'packing.templatesData.business.items.tie', category: 'clothes' },
      { nameKey: 'packing.templatesData.business.items.laptop', category: 'tech' },
      { nameKey: 'packing.templatesData.business.items.laptopCharger', category: 'tech' },
      { nameKey: 'packing.templatesData.business.items.workDocs', category: 'docs' },
      { nameKey: 'packing.templatesData.business.items.businessCards', category: 'docs' },
      { nameKey: 'packing.templatesData.business.items.notebook', category: 'other' },
    ],
  },
};

export function buildSeedsFromTemplates(keys: PackingTemplateKey[]): PackingSeed[] {
  const seen = new Set<string>();
  const seeds: PackingSeed[] = [];

  for (const key of keys) {
    for (const item of PACKING_TEMPLATES[key].items) {
      const name = i18n.t(item.nameKey);
      const norm = name.trim().toLowerCase();
      if (seen.has(norm)) continue;
      seen.add(norm);
      seeds.push({ name, category: item.category });
    }
  }

  return seeds;
}
