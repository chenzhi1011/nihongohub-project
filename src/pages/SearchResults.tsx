import type { ResourceRecord } from '../types/resource';
import { ResourceCard } from '../components/ResourceCard';

type Props = {
  results: Array<ResourceRecord & { categoryName: string }>;
  darkMode: boolean;
  t: (key: string) => string;
  authenticated: boolean;
  onToggleMark: (resourceId: number, marked: boolean) => void;
  onLoginRequired: () => void;
  onVisit: (resourceId: number) => void;
  resolveMarked: (resourceId: number, serverMarked: boolean) => boolean;
  markPendingIds: number[];
};

export function SearchResults({ results, darkMode, t, authenticated, onToggleMark, onLoginRequired, onVisit, resolveMarked, markPendingIds }: Props) {
  return (
    <div className="mb-8">
      <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-[#f5ead8]' : 'text-[#2f2218]'}`}>{t('searchResults')}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {results.map((resource, index) => (
          <ResourceCard
            key={index}
            resource={resource}
            authenticated={authenticated}
            marked={resolveMarked(resource.id, resource.marked)}
            markPending={markPendingIds.includes(resource.id)}
            darkMode={darkMode}
            t={t}
            variant="search"
            showCategoryLine
            onToggleMark={onToggleMark}
            onLoginRequired={onLoginRequired}
            onVisit={onVisit}
          />
        ))}
      </div>
    </div>
  );
}
