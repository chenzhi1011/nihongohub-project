import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCatalog } from '../api/resourceCatalogApi';
import { fetchPrivateResources, fetchRecentHistory } from '../api/resourceApi';
import { buildSpaceSnapshot } from '../service/spaceService';
import type { CategoryCatalog, HistoryItem, ResourceRecord, SpaceSnapshot } from '../types/resource';

export type SpaceDependencies = {
  fetchCatalog: () => Promise<CategoryCatalog[]>;
  fetchPrivateResources: () => Promise<ResourceRecord[]>;
  fetchRecentHistory: () => Promise<HistoryItem[]>;
};

const defaultDependencies: SpaceDependencies = {
  fetchCatalog,
  fetchPrivateResources,
  fetchRecentHistory,
};

export function useSpace(enabled: boolean, dependencies: SpaceDependencies = defaultDependencies) {
  const requestVersion = useRef(0);
  const [data, setData] = useState<SpaceSnapshot | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<unknown>(null);

  const retry = useCallback(async () => {
    if (!enabled) return;
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);
    try {
      const [catalog, privateResources, recentHistory] = await Promise.all([
        dependencies.fetchCatalog(),
        dependencies.fetchPrivateResources(),
        dependencies.fetchRecentHistory(),
      ]);
      if (requestVersion.current === version) {
        setData(buildSpaceSnapshot(catalog, privateResources, recentHistory));
      }
    } catch (nextError) {
      if (requestVersion.current === version) {
        setData(null);
        setError(nextError);
      }
    } finally {
      if (requestVersion.current === version) setLoading(false);
    }
  }, [dependencies, enabled]);

  useEffect(() => {
    if (!enabled) {
      requestVersion.current += 1;
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    void retry();
    return () => {
      requestVersion.current += 1;
    };
  }, [enabled, retry]);

  return { data, loading, error, retry };
}
