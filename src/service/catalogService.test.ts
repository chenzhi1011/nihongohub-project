import { describe, expect, it } from 'vitest';
import type { CategoryMetadata, TranslationMap } from '../data/types';
import { makeTranslator, resolveActiveCategoryId } from './catalogService';

const Icon = () => null;

const categories: CategoryMetadata[] = [
  {
    id: 'listening',
    nameKey: 'categoryListening',
    icon: Icon,
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

  it('resolves /space without treating it as a resource category', () => {
    expect(resolveActiveCategoryId('/space', categories)).toBe('space');
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
