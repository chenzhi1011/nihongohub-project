import {
  RESOURCE_CATEGORY_ORDER,
  type CategoryCatalog,
  type HistoryItem,
  type ResourceRecord,
  type SpaceSnapshot,
} from '../types/resource';

export function buildSpaceSnapshot(
  catalog: CategoryCatalog[],
  privateResources: ResourceRecord[],
  recentHistory: HistoryItem[],
): SpaceSnapshot {
  const markedPublic = catalog.flatMap((section) => section.resources).filter((resource) => resource.marked);
  const candidates = [...markedPublic, ...privateResources];

  const sections = RESOURCE_CATEGORY_ORDER.flatMap((category) => {
    const seen = new Set<number>();
    const resources = candidates.filter((resource) => {
      if (resource.category !== category || seen.has(resource.id)) return false;
      seen.add(resource.id);
      return true;
    });
    return resources.length > 0 ? [{ category, resources }] : [];
  });

  return { recentHistory, sections };
}
