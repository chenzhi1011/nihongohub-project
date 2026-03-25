import { Menu, X, Globe, Moon, Sun } from 'lucide-react';
import type { Category, Language } from '../data/types';

type Props = {
  categories: Category[];
  activeCategory: string;
  darkMode: boolean;
  language: Language;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onToggleDarkMode: () => void;
  onToggleLanguage: () => void;
  onCategoryClick: (categoryId: string) => void;
  onLogoClick: () => void;
  t: (key: string) => string;
};

export function Header({
  categories,
  activeCategory,
  darkMode,
  language,
  mobileMenuOpen,
  onToggleMobileMenu,
  onToggleDarkMode,
  onToggleLanguage,
  onCategoryClick,
  onLogoClick,
  t,
}: Props) {
  return (
    <header
      className={`shadow-sm border-b transition-colors duration-300 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 relative">
          <div className="flex items-center">
            <button
              type="button"
              onClick={onLogoClick}
              className={`whitespace-nowrap text-xl font-bold transition-colors ${
                darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              {t('title')}
            </button>
          </div>

          <nav className="hidden lg:flex items-center space-x-1">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onCategoryClick(category.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    activeCategory === category.id
                      ? darkMode
                        ? 'bg-blue-900 text-blue-200'
                        : 'bg-blue-100 text-blue-700'
                      : darkMode
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="text-center leading-tight break-words w-[41px]">{t(category.nameKey)}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={onToggleLanguage}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
              aria-label="Toggle language"
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">{language === 'zh' ? 'jp' : '中'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleDarkMode}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleMobileMenu}
            className={`lg:hidden p-2 rounded-md transition-colors ${
              darkMode
                ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className={`lg:hidden border-t transition-colors duration-300 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onCategoryClick(category.id)}
                  className={`flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    activeCategory === category.id
                      ? darkMode
                        ? 'bg-blue-900 text-blue-200'
                        : 'bg-blue-100 text-blue-700'
                      : darkMode
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{t(category.nameKey)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
