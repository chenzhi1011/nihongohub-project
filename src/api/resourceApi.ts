import { AppError, createOperationId } from '../errors/appError';
import type { HistoryItem, PrivateResourceInput, SavePrivateResourceResult, SimilarResourceMatch } from '../types/resource';
import { toAppError } from './apiError';
import { mapHistoryRows, mapMutationResult, mapSimilarRows } from './resourceMappers';
import { supabase, type AppSupabaseClient } from './supabaseClient';

type SimilarReviewOptions = { similarResourcesReviewed: boolean };

function requireClient(client: AppSupabaseClient | null, operationId: string): AppSupabaseClient {
  if (client) return client;
  throw new AppError({
    code: 'UNKNOWN',
    message: 'Supabase 尚未配置',
    operationId,
    retryable: false,
  });
}

export function createResourceApi(client: AppSupabaseClient | null) {
  async function run<T>(operation: (configured: AppSupabaseClient) => Promise<T>): Promise<T> {
    const operationId = createOperationId();
    try {
      return await operation(requireClient(client, operationId));
    } catch (error) {
      throw toAppError(error, operationId);
    }
  }

  return {
    setResourceMark(resourceId: number, marked: boolean): Promise<void> {
      return run(async (configured) => {
        const { error } = await configured.rpc('set_resource_mark', {
          p_resource_id: resourceId,
          p_marked: marked,
        });
        if (error) throw error;
      });
    },

    recordResourceVisit(resourceId: number): Promise<void> {
      return run(async (configured) => {
        const { error } = await configured.rpc('record_resource_visit', { p_resource_id: resourceId });
        if (error) throw error;
      });
    },

    fetchRecentHistory(requestedLimit = 30): Promise<HistoryItem[]> {
      return run(async (configured) => {
        const safeLimit = Math.min(Math.max(Math.trunc(requestedLimit), 1), 100);
        const { data, error } = await configured
          .from('resource_history')
          .select(`
            visit_count,
            last_visited_at,
            resources!inner(
              id,
              name,
              description,
              url,
              tags,
              owner_id,
              resource_categories(category, sort_order)
            )
          `)
          .order('last_visited_at', { ascending: false })
          .limit(safeLimit);
        if (error) throw error;
        return mapHistoryRows(data ?? []);
      });
    },

    findSimilarResources(url: string, excludeResourceId?: number): Promise<SimilarResourceMatch[]> {
      return run(async (configured) => {
        const { data, error } = await configured.rpc('find_similar_resources', {
          p_url: url,
          p_exclude_resource_id: excludeResourceId,
        });
        if (error) throw error;
        return mapSimilarRows(data ?? []);
      });
    },

    createPrivateResource(
      input: PrivateResourceInput,
      options: SimilarReviewOptions,
    ): Promise<SavePrivateResourceResult> {
      return run(async (configured) => {
        const { data, error } = await configured.rpc('create_private_resource', {
          p_category: input.category,
          p_name: input.name,
          p_description: input.description,
          p_url: input.url,
          p_tags: input.tags,
          p_similar_resources_reviewed: options.similarResourcesReviewed,
        });
        if (error) throw error;
        return mapMutationResult(data);
      });
    },

    updatePrivateResource(
      resourceId: number,
      input: PrivateResourceInput,
      options: SimilarReviewOptions,
    ): Promise<SavePrivateResourceResult> {
      return run(async (configured) => {
        const { data, error } = await configured.rpc('update_private_resource', {
          p_resource_id: resourceId,
          p_category: input.category,
          p_name: input.name,
          p_description: input.description,
          p_url: input.url,
          p_tags: input.tags,
          p_similar_resources_reviewed: options.similarResourcesReviewed,
        });
        if (error) throw error;
        return mapMutationResult(data);
      });
    },

    deletePrivateResource(resourceId: number): Promise<void> {
      return run(async (configured) => {
        const { error } = await configured.from('resources').delete().eq('id', resourceId);
        if (error) throw error;
      });
    },
  };
}

const resourceApi = createResourceApi(supabase);

export const setResourceMark = resourceApi.setResourceMark;
export const recordResourceVisit = resourceApi.recordResourceVisit;
export const fetchRecentHistory = resourceApi.fetchRecentHistory;
export const findSimilarResources = resourceApi.findSimilarResources;
export const createPrivateResource = resourceApi.createPrivateResource;
export const updatePrivateResource = resourceApi.updatePrivateResource;
export const deletePrivateResource = resourceApi.deletePrivateResource;
