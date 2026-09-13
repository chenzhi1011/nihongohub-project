import type { CategoryCatalog, ResourceRecord } from '../types/resource';
import { createOperationId, AppError } from '../errors/appError';
import { toAppError } from './apiError';
import { mapCatalogRows } from './resourceMappers';
import { supabase, type AppSupabaseClient } from './supabaseClient';

function requireClient(client: AppSupabaseClient | null, operationId: string): AppSupabaseClient {
  if (client) return client;
  throw new AppError({
    code: 'UNKNOWN',
    message: 'Supabase 尚未配置',
    operationId,
    retryable: false,
  });
}

export function createResourceCatalogApi(client: AppSupabaseClient | null) {
  return {
    async fetchCatalog(): Promise<CategoryCatalog[]> {
      const operationId = createOperationId();
      try {
        const { data, error } = await requireClient(client, operationId).rpc('get_catalog_snapshot');
        if (error) throw error;
        return mapCatalogRows(data ?? []);
      } catch (error) {
        throw toAppError(error, operationId);
      }
    },
  };
}

export function searchVisibleCatalog(query: string, catalog: CategoryCatalog[]): ResourceRecord[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [];

  return catalog.flatMap((section) => section.resources).filter((resource) =>
    resource.name.toLocaleLowerCase().includes(normalizedQuery)
    || resource.description.toLocaleLowerCase().includes(normalizedQuery)
    || resource.tags.some((tag) => tag.toLocaleLowerCase().includes(normalizedQuery))
  ).slice(0, 100);
}

const resourceCatalogApi = createResourceCatalogApi(supabase);
export const fetchCatalog = resourceCatalogApi.fetchCatalog;
