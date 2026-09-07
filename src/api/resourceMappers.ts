import type { Database } from '../types/database';
import type {
  CategoryCatalog,
  HistoryItem,
  ResourceCategory,
  ResourceRecord,
  SavePrivateResourceResult,
  SimilarResourceMatch,
} from '../types/resource';

type CatalogRow = Database['public']['Functions']['get_catalog_snapshot']['Returns'][number];
type SimilarRow = Database['public']['Functions']['find_similar_resources']['Returns'][number];
type ValidatedSimilarRow = SimilarRow & {
  source: 'public' | 'private';
  match_type: 'exact_url' | 'same_normalized_url';
};

const categories = new Set<ResourceCategory>([
  'basic', 'exam', 'listening', 'speaking', 'reading', 'writing', 'tools', 'japan', 'weekly',
]);
const categoryOrder = [...categories];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCategory(value: unknown): value is ResourceCategory {
  return typeof value === 'string' && categories.has(value as ResourceCategory);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isCatalogRow(row: unknown): row is CatalogRow {
  if (!isRecord(row)) return false;
  return isCategory(row.category)
    && typeof row.resource_id === 'number'
    && typeof row.name === 'string'
    && typeof row.description === 'string'
    && typeof row.url === 'string'
    && isStringArray(row.tags)
    && typeof row.sort_order === 'number'
    && typeof row.total_count === 'number'
    && typeof row.locked_count === 'number'
    && typeof row.marked === 'boolean';
}

function catalogResource(row: CatalogRow): ResourceRecord {
  return {
    id: row.resource_id,
    category: row.category,
    name: row.name,
    description: row.description,
    url: row.url,
    tags: row.tags,
    source: 'public',
    marked: row.marked,
    sortOrder: row.sort_order,
  };
}

export function mapCatalogRows(rows: unknown[]): CategoryCatalog[] {
  const grouped = new Map<ResourceCategory, CategoryCatalog>();

  for (const candidate of rows) {
    if (!isCatalogRow(candidate)) throw new Error('Invalid catalog row');
    const current = grouped.get(candidate.category);
    if (current) {
      current.resources.push(catalogResource(candidate));
    } else {
      grouped.set(candidate.category, {
        category: candidate.category,
        resources: [catalogResource(candidate)],
        totalCount: candidate.total_count,
        lockedCount: candidate.locked_count,
      });
    }
  }

  return [...grouped.values()];
}

function isSimilarRow(row: unknown): row is ValidatedSimilarRow {
  if (!isRecord(row)) return false;
  return typeof row.resource_id === 'number'
    && isCategory(row.category)
    && typeof row.sort_order === 'number'
    && typeof row.name === 'string'
    && typeof row.description === 'string'
    && typeof row.url === 'string'
    && isStringArray(row.tags)
    && (row.source === 'public' || row.source === 'private')
    && (row.match_type === 'exact_url' || row.match_type === 'same_normalized_url');
}

export function mapSimilarRows(rows: unknown[]): SimilarResourceMatch[] {
  return rows.map((candidate) => {
    if (!isSimilarRow(candidate)) throw new Error('Invalid similar resource row');
    return {
      resource: {
        id: candidate.resource_id,
        category: candidate.category,
        name: candidate.name,
        description: candidate.description,
        url: candidate.url,
        tags: candidate.tags,
        source: candidate.source,
        marked: false,
        sortOrder: candidate.sort_order,
      },
      matchType: candidate.match_type,
    };
  });
}

export function mapMutationResult(value: unknown): SavePrivateResourceResult {
  if (!isRecord(value) || typeof value.status !== 'string') {
    throw new Error('Invalid resource mutation response');
  }

  if (value.status === 'saved' && typeof value.resourceId === 'number') {
    return { status: 'saved', resourceId: value.resourceId };
  }
  if (value.status === 'invalid_input') return { status: 'invalid_input' };
  if (value.status === 'private_limit_reached'
    && typeof value.current === 'number' && typeof value.limit === 'number') {
    return { status: value.status, current: value.current, limit: value.limit };
  }
  if (['exact_url_exists', 'similar_review_required', 'similar_limit_reached'].includes(value.status)
    && Array.isArray(value.recommendations)) {
    return {
      status: value.status as 'exact_url_exists' | 'similar_review_required' | 'similar_limit_reached',
      recommendations: mapSimilarRows(value.recommendations),
    };
  }

  throw new Error('Invalid resource mutation response');
}

export function mapHistoryRows(rows: unknown[]): HistoryItem[] {
  return rows.map((candidate) => {
    if (!isRecord(candidate)
      || typeof candidate.visit_count !== 'number'
      || typeof candidate.last_visited_at !== 'string'
      || !isRecord(candidate.resources)) {
      throw new Error('Invalid history row');
    }

    const resource = candidate.resources;
    const rawPlacements = resource.resource_categories;
    if (typeof resource.id !== 'number'
      || typeof resource.name !== 'string'
      || typeof resource.description !== 'string'
      || typeof resource.url !== 'string'
      || !isStringArray(resource.tags)
      || (resource.owner_id !== null && typeof resource.owner_id !== 'string')
      || !Array.isArray(rawPlacements)) {
      throw new Error('Invalid history row');
    }

    const placements = rawPlacements.filter((placement): placement is { category: ResourceCategory; sort_order: number } =>
      isRecord(placement) && isCategory(placement.category) && typeof placement.sort_order === 'number'
    ).sort((left, right) =>
      categoryOrder.indexOf(left.category) - categoryOrder.indexOf(right.category)
      || left.sort_order - right.sort_order
    );
    const placement = placements[0];
    if (!placement) throw new Error('Invalid history row');

    return {
      visitCount: candidate.visit_count,
      lastVisitedAt: candidate.last_visited_at,
      resource: {
        id: resource.id,
        category: placement.category,
        name: resource.name,
        description: resource.description,
        url: resource.url,
        tags: resource.tags,
        source: resource.owner_id === null ? 'public' : 'private',
        marked: false,
        sortOrder: placement.sort_order,
      },
    };
  });
}
