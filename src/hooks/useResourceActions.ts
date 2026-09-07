import { useCallback, useMemo, useRef, useState } from 'react';
import {
  createPrivateResource,
  deletePrivateResource,
  recordResourceVisit,
  setResourceMark,
  updatePrivateResource,
} from '../api/resourceApi';
import { AppError } from '../errors/appError';
import { reportError } from '../observability/errorReporter';
import type { PrivateResourceInput, SavePrivateResourceResult } from '../types/resource';

function reportHandledError(
  error: unknown,
  event: string,
  details: { resourceId?: number; category?: PrivateResourceInput['category'] } = {},
): void {
  if (!(error instanceof AppError)) return;
  const mode = import.meta.env.MODE;
  const environment = mode === 'production' ? 'production' : mode === 'preview' ? 'preview' : 'development';
  reportError(error, {
    event,
    layer: 'hook',
    release: import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA ?? 'local',
    environment,
    ...details,
  });
}

export type ResourceActionDependencies = {
  setResourceMark: typeof setResourceMark;
  recordResourceVisit: typeof recordResourceVisit;
  createPrivateResource: typeof createPrivateResource;
  updatePrivateResource: typeof updatePrivateResource;
  deletePrivateResource: typeof deletePrivateResource;
  refreshSpace: () => Promise<unknown>;
};

const defaultApiDependencies = {
  setResourceMark,
  recordResourceVisit,
  createPrivateResource,
  updatePrivateResource,
  deletePrivateResource,
};

export function useResourceActions(
  dependencyOverrides: Partial<ResourceActionDependencies> = {},
) {
  const dependencies: ResourceActionDependencies = useMemo(() => ({
    ...defaultApiDependencies,
    refreshSpace: async () => undefined,
    ...dependencyOverrides,
  }), [dependencyOverrides]);
  const [markOverrides, setMarkOverrides] = useState<Record<number, boolean>>({});
  const pendingMarkIdsRef = useRef(new Set<number>());
  const [markPendingIds, setMarkPendingIds] = useState<number[]>([]);
  const [error, setError] = useState<unknown>(null);

  const resolveMarked = useCallback(
    (resourceId: number, serverMarked: boolean) => markOverrides[resourceId] ?? serverMarked,
    [markOverrides],
  );

  const toggleMark = useCallback(async (resourceId: number, currentMarked: boolean) => {
    if (pendingMarkIdsRef.current.has(resourceId)) return;
    pendingMarkIdsRef.current.add(resourceId);
    setMarkPendingIds(Array.from(pendingMarkIdsRef.current));
    const nextMarked = !currentMarked;
    setError(null);
    setMarkOverrides((current) => ({ ...current, [resourceId]: nextMarked }));
    try {
      await dependencies.setResourceMark(resourceId, nextMarked);
      await dependencies.refreshSpace();
    } catch (nextError) {
      setMarkOverrides((current) => ({ ...current, [resourceId]: currentMarked }));
      setError(nextError);
      reportHandledError(nextError, 'resource_mark_failed', { resourceId });
      throw nextError;
    } finally {
      pendingMarkIdsRef.current.delete(resourceId);
      setMarkPendingIds(Array.from(pendingMarkIdsRef.current));
    }
  }, [dependencies]);

  const recordVisit = useCallback((resourceId: number): void => {
    void dependencies.recordResourceVisit(resourceId).catch((nextError) => {
      setError(nextError);
      reportHandledError(nextError, 'resource_history_failed', { resourceId });
    });
  }, [dependencies]);

  const createResource = useCallback(async (
    input: PrivateResourceInput,
    similarResourcesReviewed: boolean,
  ): Promise<SavePrivateResourceResult> => {
    setError(null);
    try {
      const result = await dependencies.createPrivateResource(input, { similarResourcesReviewed });
      if (result.status === 'saved') await dependencies.refreshSpace();
      return result;
    } catch (nextError) {
      setError(nextError);
      reportHandledError(nextError, 'private_resource_create_failed', { category: input.category });
      throw nextError;
    }
  }, [dependencies]);

  const updateResource = useCallback(async (
    resourceId: number,
    input: PrivateResourceInput,
    similarResourcesReviewed: boolean,
  ): Promise<SavePrivateResourceResult> => {
    setError(null);
    try {
      const result = await dependencies.updatePrivateResource(
        resourceId,
        input,
        { similarResourcesReviewed },
      );
      if (result.status === 'saved') await dependencies.refreshSpace();
      return result;
    } catch (nextError) {
      setError(nextError);
      reportHandledError(nextError, 'private_resource_update_failed', { resourceId, category: input.category });
      throw nextError;
    }
  }, [dependencies]);

  const deleteResource = useCallback(async (resourceId: number): Promise<void> => {
    setError(null);
    try {
      await dependencies.deletePrivateResource(resourceId);
      await dependencies.refreshSpace();
    } catch (nextError) {
      setError(nextError);
      reportHandledError(nextError, 'private_resource_delete_failed', { resourceId });
      throw nextError;
    }
  }, [dependencies]);

  return {
    error,
    markPendingIds,
    resolveMarked,
    toggleMark,
    recordVisit,
    createResource,
    updateResource,
    deleteResource,
  };
}
