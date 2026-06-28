export type PackingCategory = 'docs' | 'clothes' | 'tech' | 'hygiene' | 'other';

export type PackingItem = {
  id: string;
  tripId: string;
  name: string;
  category: PackingCategory;
  checked: boolean;
  createdAt: string;
};
