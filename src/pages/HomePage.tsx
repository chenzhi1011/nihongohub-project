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
        <h1 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('welcomeTitle')}</h1>
        <p className={`text-xl max-w-2xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {t('welcomeDesc')}
        </p>
      </div>

      <div
        className={`rounded-lg p-6 text-white transition-all duration-300 ${
          darkMode ? 'bg-gradient-to-r from-blue-600 to-purple-700' : 'bg-gradient-to-r from-blue-500 to-purple-600'
        }`}
      >
        <h2 className="text-2xl font-bold mb-4">{language === 'zh' ? '今日短语' : '今日の単語'} </h2>
        <div className="space-y-2">
          <p className="text-3xl font-bold">{todaysPhrase.japanese}</p>
          <p className="text-lg italic">{todaysPhrase.romaji}</p>
          <p className="text-lg">{todaysPhrase.zh}</p>
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
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center mb-2">
                <IconComponent className={`w-6 h-6 mr-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {t(category.nameKey)}
                </h3>
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {category.resources.length} {t('resourcesAvailable')}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
