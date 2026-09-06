import { describe, expect, it } from 'vitest';
import type { Category, TranslationMap } from '../data/types';
import { makeTranslator, resolveActiveCategoryId, searchResources } from './catalogService';

const Icon = () => null;

const categories: Category[] = [
  {
    id: 'listening',
    nameKey: 'categoryListening',
    icon: Icon,
    resources: [
      {
        name: 'NHK Easy News',
        description: 'Japanese news with audio',
        url: 'https://example.com/news',
        tags: ['Beginner', 'Listening'],
      },
    ],
  },
];

describe('resolveActiveCategoryId', () => {
  it('maps the root route to home', () => {
    expect(resolveActiveCategoryId('/', categories)).toBe('home');
  });

  it('keeps a known category and falls back for an unknown route', () => {
    expect(resolveActiveCategoryId('/listening', categories)).toBe('listening');
    expect(resolveActiveCategoryId('/missing', categories)).toBe('home');
  });
});

describe('makeTranslator', () => {
  it('uses the selected language and falls back to the key', () => {
    const translations: TranslationMap = {
      categoryListening: { zh: '听力', jp: 'リスニング' },
    };

    const translate = makeTranslator(translations, 'zh');

    expect(translate('categoryListening')).toBe('听力');
    expect(translate('missing')).toBe('missing');
  });
});

describe('searchResources', () => {
  it('returns no results for a blank query', () => {
    expect(searchResources('   ', categories, (key) => key)).toEqual([]);
  });

  it.each(['nhk', 'AUDIO', 'listening'])(
    'matches %s case-insensitively across resource fields',
    (query) => {
      const results = searchResources(query, categories, () => '听力');

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        name: 'NHK Easy News',
        categoryName: '听力',
      });
    },
  );
});
