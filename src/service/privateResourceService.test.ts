import { describe, expect, it } from 'vitest';
import { buildPrivateResourceInput, type PrivateResourceDraft } from './privateResourceService';

const validDraft: PrivateResourceDraft = {
  category: 'reading',
  name: '  NHK Article  ',
  description: '  Direct reading page  ',
  url: '  https://example.com/article  ',
  tags: ' news, beginner,news ',
};

describe('buildPrivateResourceInput', () => {
  it('trims fields and deduplicates comma-separated tags', () => {
    expect(buildPrivateResourceInput(validDraft)).toEqual({
      valid: true,
      input: {
        category: 'reading',
        name: 'NHK Article',
        description: 'Direct reading page',
        url: 'https://example.com/article',
        tags: ['news', 'beginner'],
      },
    });
  });

  it('requires category, name, description, and an HTTP(S) URL', () => {
    const result = buildPrivateResourceInput({
      category: '',
      name: ' ',
      description: '',
      url: 'ftp://example.com/file',
      tags: '',
    });

    expect(result).toMatchObject({
      valid: false,
      errors: {
        category: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
        url: expect.any(String),
      },
    });
  });

  it('rejects field and tag limits before calling the API', () => {
    const result = buildPrivateResourceInput({
      ...validDraft,
      name: 'n'.repeat(121),
      description: 'd'.repeat(501),
      url: `https://example.com/${'u'.repeat(2030)}`,
      tags: Array.from({ length: 11 }, (_, index) => `tag-${index}`).join(','),
    });

    expect(result).toMatchObject({
      valid: false,
      errors: {
        name: expect.any(String),
        description: expect.any(String),
        url: expect.any(String),
        tags: expect.any(String),
      },
    });
  });

  it('rejects a tag longer than 30 characters', () => {
    const result = buildPrivateResourceInput({ ...validDraft, tags: 'a'.repeat(31) });

    expect(result).toMatchObject({ valid: false, errors: { tags: expect.any(String) } });
  });
});
