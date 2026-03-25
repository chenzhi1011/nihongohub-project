import type { Category, Language, Resource, TranslationMap } from '../data/types';

export function resolveActiveCategoryId(pathname: string, categoryList: Category[]): string {
  if (pathname === '/') return 'home';
  const id = pathname.slice(1);
  return categoryList.some((c) => c.id === id) ? id : 'home';
}

export function makeTranslator(translations: TranslationMap, language: Language) {
  return (key: string): string => translations[key]?.[language] ?? key;
}

export type ResourceWithCategory = Resource & { categoryName: string };

export function searchResources(
  query: string,
  categoryList: Category[],
  translateCategoryName: (nameKey: string) => string,
): ResourceWithCategory[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const results: ResourceWithCategory[] = [];

  for (const category of categoryList) {
    for (const resource of category.resources) {
      const match =
        resource.name.toLowerCase().includes(q) ||
        resource.description.toLowerCase().includes(q) ||
        resource.tags.some((tag) => tag.toLowerCase().includes(q));
      if (match) {
        results.push({ ...resource, categoryName: translateCategoryName(category.nameKey) });
      }
    }
  }
  return results;
}

export function pickRandomPhrase<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}
