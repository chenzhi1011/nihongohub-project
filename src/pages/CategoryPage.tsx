import type { Category } from '../data/types';
import type { Resource } from '../data/types';
import { ResourceCard } from '../components/ResourceCard';
import { AddResourceButton } from '../components/AddResourceButton';

type Props = {
  category: Category;
  darkMode: boolean;
  t: (key: string) => string;
  onAddResource: (categoryId: string, resource: Resource) => void;
};

export function CategoryPage({ category, darkMode, t, onAddResource }: Props) {
  const IconComponent = category.icon;

  return (
    <div>
      <div className="flex items-center mb-6">
        <IconComponent className={`w-8 h-8 mr-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t(category.nameKey)}</h1>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {category.resources.map((resource, index) => (
          <ResourceCard key={index} resource={resource} darkMode={darkMode} t={t} variant="category" />
        ))}
        <AddResourceButton
          darkMode={darkMode}
          t={t}
          onSubmit={(resource) => onAddResource(category.id, resource)}
        />
      </div>
    </div>
  );
}
