import type { CategoryMetadata, Language, TranslationMap } from '../data/types';

export function resolveActiveCategoryId(pathname: string, categoryList: CategoryMetadata[]): string {
  if (pathname === '/') return 'home';
  const id = pathname.slice(1);
  return categoryList.some((c) => c.id === id) ? id : 'home';
}

export function makeTranslator(translations: TranslationMap, language: Language) {
  return (key: string): string => translations[key]?.[language] ?? key;
}

export function pickRandomPhrase<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}
