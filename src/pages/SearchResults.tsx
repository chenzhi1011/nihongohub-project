import type { ResourceWithCategory } from '../service/catalogService';
import { ResourceCard } from '../components/ResourceCard';

type Props = {
  results: ResourceWithCategory[];
  darkMode: boolean;
  t: (key: string) => string;
};

export function SearchResults({ results, darkMode, t }: Props) {
  return (
    <div className="mb-8">
      <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-[#f5ead8]' : 'text-[#2f2218]'}`}>{t('searchResults')}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {results.map((resource, index) => (
          <ResourceCard
            key={index}
            resource={resource}
            darkMode={darkMode}
            t={t}
            variant="search"
            showCategoryLine
          />
        ))}
      </div>
    </div>
  );
}
