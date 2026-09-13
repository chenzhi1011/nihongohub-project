import { ExternalLink } from 'lucide-react';
import type { HistoryItem } from '../types/resource';

type Props = {
  items: HistoryItem[];
  darkMode: boolean;
  t: (key: string) => string;
  onVisit: (resourceId: number) => void;
};

export function HistoryRail({ items, darkMode, t, onVisit }: Props) {
  return (
    <div
      role="region"
      aria-label={t('recentHistory')}
      className="overflow-x-auto pb-3"
    >
      <div className="flex w-max gap-3">
        {items.map((item) => (
          <a
            key={item.resource.id}
            href={item.resource.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onVisit(item.resource.id)}
            className={`flex w-64 flex-none items-center justify-between gap-3 rounded-lg border px-4 py-3 shadow-sm transition-colors ${
              darkMode
                ? 'border-[#4a3f33] bg-[#2a241d] text-[#f5ead8] hover:bg-[#342c24]'
                : 'border-[#d8c8ae] bg-[#fff8ec] text-[#2f2218] hover:bg-[#f9eddd]'
            }`}
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">{item.resource.name}</span>
              <span className={`mt-0.5 block text-xs ${darkMode ? 'text-[#bca891]' : 'text-[#8f7f69]'}`}>
                {t('visitCount').replace('{count}', String(item.visitCount))}
              </span>
            </span>
            <ExternalLink className="h-4 w-4 flex-none" />
          </a>
        ))}
      </div>
    </div>
  );
}
