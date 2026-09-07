import type { Category } from '../data/types';
import type { CategoryCatalog } from '../types/resource';
import { ResourceCard } from '../components/ResourceCard';
import { LockedResourcesCard } from '../components/LockedResourcesCard';

type Props = {
  category: CategoryCatalog;
  metadata: Category;
  darkMode: boolean;
  t: (key: string) => string;
  onLoginRequired: () => void;
  authenticated?: boolean;
  onToggleMark?: (resourceId: number, marked: boolean) => void;
  onVisit?: (resourceId: number) => void;
  resolveMarked?: (resourceId: number, serverMarked: boolean) => boolean;
  markPendingIds?: number[];
};

export function CategoryPage({ category, metadata, darkMode, t, onLoginRequired, authenticated = false, onToggleMark = () => undefined, onVisit = () => undefined, resolveMarked = (_id, marked) => marked, markPendingIds = [] }: Props) {
  const IconComponent = metadata.icon;

  return (
    <div>
      <div className="flex items-center mb-6">
        <IconComponent className={`w-8 h-8 mr-3 ${darkMode ? 'text-[#f0a36b]' : 'text-[#b3572a]'}`} />
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-[#f5ead8]' : 'text-[#2f2218]'}`}>{t(metadata.nameKey)}</h1>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {category.resources.map((resource) => (
          <ResourceCard
            key={`${resource.id}-${resource.category}`}
            resource={resource}
            authenticated={authenticated}
            marked={resolveMarked(resource.id, resource.marked)}
            markPending={markPendingIds.includes(resource.id)}
            darkMode={darkMode}
            t={t}
            variant="category"
            onToggleMark={onToggleMark}
            onLoginRequired={onLoginRequired}
            onVisit={onVisit}
          />
        ))}
        {category.lockedCount > 0 && (
          <LockedResourcesCard
            lockedCount={category.lockedCount}
            darkMode={darkMode}
            t={t}
            onLoginRequired={onLoginRequired}
          />
        )}
      </div>
    </div>
  );
}
