import { ExternalLink } from 'lucide-react';
import type { Resource } from '../data/types';
import { getTagColor } from '../utils/tagStyles';

type Props = {
  resource: Resource & { categoryName?: string };
  darkMode: boolean;
  t: (key: string) => string;
  variant: 'search' | 'category';
  showCategoryLine?: boolean;
};

export function ResourceCard({ resource, darkMode, t, variant, showCategoryLine }: Props) {
  const titleClass = darkMode ? 'text-white' : 'text-gray-900';
  const titleSize = variant === 'search' ? 'font-semibold' : 'text-lg font-semibold';
  const descClass = variant === 'search' ? 'text-sm mb-2' : 'mb-3';
  const descColor = darkMode ? 'text-gray-300' : 'text-gray-600';
  const tagSize = variant === 'search' ? 'text-xs' : 'text-sm';
  const tagPad = variant === 'search' ? 'px-2 py-1' : 'px-3 py-1';
  const iconSize = variant === 'search' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div
      className={`rounded-lg shadow-sm border p-4 hover:shadow-md transition-all duration-200 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className={`${titleSize} ${titleClass}`}>{resource.name}</h3>
        <ExternalLink className={`${iconSize} flex-shrink-0 ml-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
      </div>
      <p className={`${descClass} ${descColor}`}>{resource.description}</p>
      <div className={`flex flex-wrap ${variant === 'search' ? 'gap-1 mb-2' : 'gap-2 mb-3'}`}>
        {resource.tags.map((tag, tagIndex) => (
          <span
            key={tagIndex}
            className={`${tagPad} ${tagSize} font-medium rounded-full ${getTagColor(tag, darkMode)}`}
          >
            {tag}
          </span>
        ))}
      </div>
      {showCategoryLine && resource.categoryName && (
        <p className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {t('from')}
          {resource.categoryName}
        </p>
      )}
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${variant === 'search' ? 'text-sm' : 'inline-flex items-center'} font-medium transition-colors ${
          darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
        }`}
      >
        {variant === 'search' ? `${t('visitResource')} →` : t('visitResource')}
        {variant === 'category' && <ExternalLink className="w-4 h-4 ml-1" />}
      </a>
    </div>
  );
}
