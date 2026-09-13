import type { ElementType } from 'react';

export type Language = 'zh' | 'jp';

export interface TranslationEntry {
  zh: string;
  jp: string;
}

export type TranslationMap = Record<string, TranslationEntry>;

export interface Resource {
  name: string;
  description: string;
  url: string;
  tags: string[];
}

export interface Category {
  id: string;
  nameKey: string;
  icon: ElementType;
  resources: Resource[];
}

export interface TodaysPhrase {
  japanese: string;
  romaji: string;
  zh: string;
  level?: string;
}
