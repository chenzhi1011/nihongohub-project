import type { ElementType } from 'react';

export type Language = 'zh' | 'jp';

export interface TranslationEntry {
  zh: string;
  jp: string;
}

export type TranslationMap = Record<string, TranslationEntry>;

export interface CategoryMetadata {
  id: string;
  nameKey: string;
  icon: ElementType;
}

export interface TodaysPhrase {
  japanese: string;
  romaji: string;
  zh: string;
  level?: string;
}
