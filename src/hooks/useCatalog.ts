import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCatalog } from '../api/resourceCatalogApi';
import type { CategoryCatalog } from '../types/resource';

export type CatalogFetcher = () => Promise<CategoryCatalog[]>;

export function useCatalog(fetcher: CatalogFetcher = fetchCatalog) {
  const requestVersion = useRef(0);
  const [data, setData] = useState<CategoryCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const retry = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);
    try {
      const nextData = await fetcher();
      if (requestVersion.current === version) setData(nextData);
    } catch (nextError) {
      if (requestVersion.current === version) setError(nextError);
    } finally {
      if (requestVersion.current === version) setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    void retry();
    return () => {
      requestVersion.current += 1;
    };
  }, [retry]);

  return { data, loading, error, retry };
}
