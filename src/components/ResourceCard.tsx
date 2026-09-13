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
  const titleClass = darkMode ? 'text-[#f5ead8]' : 'text-[#2f2218]';
  const titleSize = variant === 'search' ? 'font-semibold' : 'text-lg font-semibold';
  const descClass = variant === 'search' ? 'text-sm mb-2' : 'mb-3';
  const descColor = darkMode ? 'text-[#d8c4ad]' : 'text-[#6b5845]';
  const tagSize = variant === 'search' ? 'text-xs' : 'text-sm';
  const tagPad = variant === 'search' ? 'px-2 py-1' : 'px-3 py-1';
  const iconSize = variant === 'search' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div
      className={`rounded-lg shadow-sm border p-4 hover:shadow-md transition-all duration-200 ${
        darkMode ? 'bg-[#2a241d] border-[#4a3f33]' : 'bg-[#fff8ec] border-[#d8c8ae]'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className={`${titleSize} ${titleClass}`}>{resource.name}</h3>
        <ExternalLink className={`${iconSize} flex-shrink-0 ml-2 ${darkMode ? 'text-[#8b7f6f]' : 'text-[#a89a85]'}`} />
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
        <p className={`text-xs mb-2 ${darkMode ? 'text-[#a89881]' : 'text-[#8f7f69]'}`}>
          {t('from')}
          {resource.categoryName}
        </p>
      )}
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${variant === 'search' ? 'text-sm' : 'inline-flex items-center'} font-medium transition-colors ${
          darkMode ? 'text-[#f0a36b] hover:text-[#f7b889]' : 'text-[#b3572a] hover:text-[#8f4621]'
        }`}
      >
        {variant === 'search' ? `${t('visitResource')} →` : t('visitResource')}
        {variant === 'category' && <ExternalLink className="w-4 h-4 ml-1" />}
      </a>
    </div>
  );
}
