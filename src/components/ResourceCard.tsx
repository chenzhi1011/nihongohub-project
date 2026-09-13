import { ExternalLink, MoreVertical, Star } from 'lucide-react';
import { useState } from 'react';
import type { ResourceRecord } from '../types/resource';
import { getTagColor } from '../utils/tagStyles';

type Props = {
  resource: ResourceRecord & { categoryName?: string };
  authenticated: boolean;
  marked: boolean;
  markPending?: boolean;
  darkMode: boolean;
  t: (key: string) => string;
  variant: 'search' | 'category';
  showCategoryLine?: boolean;
  onToggleMark: (resourceId: number, marked: boolean) => void;
  onLoginRequired: () => void;
  onVisit: (resourceId: number) => void;
  onEditPrivate?: (resource: ResourceRecord) => void;
  onDeletePrivate?: (resource: ResourceRecord) => void;
};

export function ResourceCard({ resource, authenticated, marked, markPending = false, darkMode, t, variant, showCategoryLine, onToggleMark, onLoginRequired, onVisit, onEditPrivate, onDeletePrivate }: Props) {
  const [actionsOpen, setActionsOpen] = useState(false);
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
        {resource.source === 'public' && (
          <button
            type="button"
            aria-label={marked ? t('unmarkResource') : t('markResource')}
            aria-pressed={marked}
            disabled={markPending}
            onClick={() => {
              if (!authenticated) {
                onLoginRequired();
                return;
              }
              onToggleMark(resource.id, marked);
            }}
            className={`ml-2 flex-shrink-0 rounded-md p-1 transition-colors ${
              marked
                ? 'text-[#d38a24]'
                : darkMode
                  ? 'text-[#8b7f6f] hover:text-[#d7b66f]'
                  : 'text-[#a89a85] hover:text-[#b9771f]'
            }`}
          >
            <Star className={`${iconSize} ${marked ? 'fill-current' : ''}`} />
          </button>
        )}
        {resource.source === 'private' && (onEditPrivate || onDeletePrivate) && (
          <div className="relative ml-2 flex-shrink-0">
            <button
              type="button"
              aria-label={t('resourceActions')}
              aria-expanded={actionsOpen}
              onClick={() => setActionsOpen((open) => !open)}
              className={`rounded-md p-1 transition-colors ${
                darkMode ? 'text-[#d8c4ad] hover:bg-[#3a3128]' : 'text-[#6b5845] hover:bg-[#efe1ce]'
              }`}
            >
              <MoreVertical className={iconSize} />
            </button>
            {actionsOpen && (
              <div className={`absolute right-0 z-10 mt-1 min-w-24 rounded-md border p-1 shadow-lg ${
                darkMode ? 'border-[#4a3f33] bg-[#2a241d]' : 'border-[#d8c8ae] bg-[#fff8ec]'
              }`}>
                {onEditPrivate && (
                  <button
                    type="button"
                    className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-black/5"
                    onClick={() => {
                      setActionsOpen(false);
                      onEditPrivate(resource);
                    }}
                  >
                    {t('editResource')}
                  </button>
                )}
                {onDeletePrivate && (
                  <button
                    type="button"
                    className="block w-full rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-red-500/10"
                    onClick={() => {
                      setActionsOpen(false);
                      onDeletePrivate(resource);
                    }}
                  >
                    {t('deleteResource')}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
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
        onClick={() => {
          if (authenticated) onVisit(resource.id);
        }}
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
