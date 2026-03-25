import type { Category, Language, TodaysPhrase } from '../data/types';

type Props = {
  categories: Category[];
  darkMode: boolean;
  language: Language;
  todaysPhrase: TodaysPhrase;
  onCategoryClick: (categoryId: string) => void;
  t: (key: string) => string;
};

export function HomePage({ categories, darkMode, language, todaysPhrase, onCategoryClick, t }: Props) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-[#f5ead8]' : 'text-[#2f2218]'}`}>{t('welcomeTitle')}</h1>
        <p className={`text-xl max-w-2xl mx-auto ${darkMode ? 'text-[#d8c4ad]' : 'text-[#6b5845]'}`}>
          {t('welcomeDesc')}
        </p>
      </div>

      <div
        className={`rounded-xl border px-7 py-5 shadow-md transition-all duration-300 ${
          darkMode
            ? 'bg-[#5a3722] border-[#ca8958] text-[#fff1de]'
            : 'bg-[#e7b884] border-[#cd8f5a] text-[#2f2218]'
        }`}
      >
        <h2 className="text-xl font-semibold tracking-wide text-left mb-3">
          {language === 'zh' ? '今日短语' : '今日の単語'}
        </h2>

        <div className="grid gap-4 md:grid-cols-[1.25fr_1fr] md:items-stretch">
          <div className="space-y-3 flex flex-col justify-center w-full max-w-[26rem] mx-auto text-center md:pr-2">
            <p className="text-5xl md:text-6xl font-medium leading-tight break-words">{todaysPhrase.japanese}</p>
            {todaysPhrase.level && (
              <span className={`inline-flex mx-auto rounded-full px-4 py-1.5 text-base font-semibold ${
                darkMode ? 'bg-[#7a4c2f] text-[#ffe4c6]' : 'bg-[#d99a63] text-[#3a281a]'
              }`}>
                {todaysPhrase.level}
              </span>
            )}
          </div>

          <div className={`space-y-3 rounded-lg p-3 ${darkMode ? 'bg-[#6a4128]/55' : 'bg-[#f0c79d]/55'}`}>
            <div>
              <p className={`text-xs uppercase tracking-[0.18em] ${darkMode ? 'text-[#f6cfab]' : 'text-[#7a4a2d]'}`}>
                Romaji
              </p>
              <p className="mt-1 text-xl italic leading-relaxed break-words">{todaysPhrase.romaji}</p>
            </div>
            <div className={`h-px ${darkMode ? 'bg-[#e7b483]/35' : 'bg-[#8f5632]/25'}`} />
            <div>
              <p className={`text-xs uppercase tracking-[0.18em] ${darkMode ? 'text-[#f6cfab]' : 'text-[#7a4a2d]'}`}>
                Meaning
              </p>
              <p className="mt-1 text-lg leading-relaxed break-words">{todaysPhrase.zh}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const IconComponent = category.icon;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategoryClick(category.id)}
              className={`rounded-lg shadow-sm border p-4 hover:shadow-md transition-all duration-200 text-left ${
                darkMode ? 'bg-[#2a241d] border-[#4a3f33] opacity-85 hover:opacity-100' : 'bg-[#fff8ec] border-[#d8c8ae] opacity-90 hover:opacity-100'
              }`}
            >
              <div className="flex items-center mb-2">
                <IconComponent className={`w-6 h-6 mr-3 ${darkMode ? 'text-[#f0a36b]' : 'text-[#b3572a]'}`} />
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-[#f5ead8]' : 'text-[#2f2218]'}`}>
                  {t(category.nameKey)}
                </h3>
              </div>
              <p className={`text-sm ${darkMode ? 'text-[#d8c4ad]' : 'text-[#6b5845]'}`}>
                {category.resources.length} {t('resourcesAvailable')}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
