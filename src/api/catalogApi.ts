import { categories, todaysPhrases, translations } from '../data';
import type { Category, TodaysPhrase, TranslationMap } from '../data/types';

/** 数据层入口：当前为本地静态数据，后续可替换为 HTTP 请求 */
export function fetchCategories(): Category[] {
  return categories;
}

export function fetchTranslations(): TranslationMap {
  return translations;
}

export function fetchTodaysPhrasePool(): TodaysPhrase[] {
  return todaysPhrases;
}
