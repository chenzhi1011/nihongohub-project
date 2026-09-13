import {
  RESOURCE_CATEGORY_ORDER,
  type PrivateResourceInput,
  type ResourceCategory,
} from '../types/resource';

export type PrivateResourceDraft = {
  category: ResourceCategory | '';
  name: string;
  description: string;
  url: string;
  tags: string;
};

type Field = keyof PrivateResourceDraft;
type ValidationErrors = Partial<Record<Field, string>>;

export type BuildPrivateResourceResult =
  | { valid: true; input: PrivateResourceInput }
  | { valid: false; errors: ValidationErrors };

const categorySet = new Set<ResourceCategory>(RESOURCE_CATEGORY_ORDER);
const lengthOf = (value: string) => [...value].length;

function hasHttpProtocol(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function buildPrivateResourceInput(draft: PrivateResourceDraft): BuildPrivateResourceResult {
  const name = draft.name.trim();
  const description = draft.description.trim();
  const url = draft.url.trim();
  const tags = [...new Set(draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean))];
  const errors: ValidationErrors = {};

  if (!draft.category || !categorySet.has(draft.category)) errors.category = 'resourceCategoryRequired';
  if (!name) errors.name = 'resourceNameRequired';
  else if (lengthOf(name) > 120) errors.name = 'resourceNameTooLong';
  if (!description) errors.description = 'resourceDescriptionRequired';
  else if (lengthOf(description) > 500) errors.description = 'resourceDescriptionTooLong';
  if (!url || !hasHttpProtocol(url)) errors.url = 'resourceUrlInvalid';
  else if (lengthOf(url) > 2048) errors.url = 'resourceUrlTooLong';
  if (tags.length > 10) errors.tags = 'resourceTagsTooMany';
  else if (tags.some((tag) => lengthOf(tag) > 30)) errors.tags = 'resourceTagTooLong';

  if (Object.keys(errors).length > 0 || !draft.category) return { valid: false, errors };

  return {
    valid: true,
    input: { category: draft.category, name, description, url, tags },
  };
}
