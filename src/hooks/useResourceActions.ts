import { useCallback, useState } from 'react';
import {
  createPrivateResource,
  deletePrivateResource,
  recordResourceVisit,
  setResourceMark,
  updatePrivateResource,
} from '../api/resourceApi';
import type { PrivateResourceInput, SavePrivateResourceResult } from '../types/resource';

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
  dependencies: ResourceActionDependencies = { ...defaultApiDependencies, refreshSpace: async () => undefined },
) {
  const [markOverrides, setMarkOverrides] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<unknown>(null);

  const resolveMarked = useCallback(
    (resourceId: number, serverMarked: boolean) => markOverrides[resourceId] ?? serverMarked,
    [markOverrides],
  );

  const toggleMark = useCallback(async (resourceId: number, currentMarked: boolean) => {
    const nextMarked = !currentMarked;
    setError(null);
    setMarkOverrides((current) => ({ ...current, [resourceId]: nextMarked }));
    try {
      await dependencies.setResourceMark(resourceId, nextMarked);
      await dependencies.refreshSpace();
    } catch (nextError) {
      setMarkOverrides((current) => ({ ...current, [resourceId]: currentMarked }));
      setError(nextError);
      throw nextError;
    }
  }, [dependencies]);

  const recordVisit = useCallback((resourceId: number): void => {
    void dependencies.recordResourceVisit(resourceId).catch((nextError) => {
      setError(nextError);
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
      throw nextError;
    }
  }, [dependencies]);

  return {
    error,
    resolveMarked,
    toggleMark,
    recordVisit,
    createResource,
    updateResource,
    deleteResource,
  };
}
