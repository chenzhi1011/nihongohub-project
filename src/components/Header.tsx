import { Globe, LogIn, LogOut, Menu, X, Moon, Sun, UserRound } from 'lucide-react';
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
  userEmail: string | null;
  authLoading: boolean;
  onOpenLogin: () => void;
  onOpenSpace: () => void;
  onSignOut: () => Promise<void>;
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
  userEmail,
  authLoading,
  onOpenLogin,
  onOpenSpace,
  onSignOut,
}: Props) {
  const handleLoginClick = () => {
    window.umami?.track('click_login_button', { link: '/track/login-button' });
    onOpenLogin();
  };

  return (
    <header
      className={`shadow-sm border-b transition-colors duration-300 ${
        darkMode ? 'bg-[#2a241d] border-[#4a3f33]' : 'bg-[#fff8ec] border-[#d8c8ae]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 relative">
          <div className="flex items-center">
            <button
              type="button"
              onClick={onLogoClick}
              className={`whitespace-nowrap text-xl font-bold transition-colors ${
                darkMode ? 'text-[#f0a36b] hover:text-[#f7b889]' : 'text-[#b3572a] hover:text-[#8f4621]'
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
                        ? 'bg-[#5d341f] text-[#ffd7b6]'
                        : 'bg-[#f6d9bf] text-[#8f4621]'
                      : darkMode
                        ? 'text-[#d9c4ad] hover:text-[#fff2df] hover:bg-[#3a3128]'
                        : 'text-[#6b5845] hover:text-[#3f3022] hover:bg-[#f4e8d7]'
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
                  ? 'bg-[#3a3128] text-[#d8c4ad] hover:bg-[#4a3e31] hover:text-[#fff0dc]'
                  : 'bg-[#efe1ce] text-[#6b5845] hover:bg-[#e7d5bd] hover:text-[#3f3022]'
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
                darkMode ? 'bg-[#3a3128] text-[#d7b66f] hover:bg-[#4a3e31]' : 'bg-[#efe1ce] text-[#6b5845] hover:bg-[#e7d5bd]'
              }`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {authLoading ? (
              <div className={`px-3 py-2 rounded-lg text-sm font-medium ${darkMode ? 'text-[#d8c4ad]' : 'text-[#6b5845]'}`}>
                ...
              </div>
            ) : userEmail ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenSpace}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    darkMode
                      ? 'bg-[#5d341f] text-[#ffd7b6] hover:bg-[#6e3e25]'
                      : 'bg-[#f6d9bf] text-[#8f4621] hover:bg-[#f1c8a3]'
                  }`}
                >
                  <UserRound className="w-4 h-4" />
                  <span>{t('space')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void onSignOut()}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    darkMode
                      ? 'bg-[#3a3128] text-[#d8c4ad] hover:bg-[#4a3e31] hover:text-[#fff0dc]'
                      : 'bg-[#efe1ce] text-[#6b5845] hover:bg-[#e7d5bd] hover:text-[#3f3022]'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="max-w-[90px] truncate">{t('logout')}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleLoginClick}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  darkMode
                    ? 'bg-[#5d341f] text-[#ffd7b6] hover:bg-[#6e3e25] hover:text-[#ffe8d2]'
                    : 'bg-[#f6d9bf] text-[#8f4621] hover:bg-[#f1c8a3] hover:text-[#6f3619]'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>{t('login')}</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleMobileMenu}
            className={`lg:hidden p-2 rounded-md transition-colors ${
              darkMode
                ? 'text-[#d8c4ad] hover:text-[#fff0dc] hover:bg-[#3a3128]'
                : 'text-[#6b5845] hover:text-[#3f3022] hover:bg-[#efe1ce]'
            }`}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className={`lg:hidden border-t transition-colors duration-300 ${
            darkMode ? 'bg-[#2a241d] border-[#4a3f33]' : 'bg-[#fff8ec] border-[#d8c8ae]'
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
                        ? 'bg-[#5d341f] text-[#ffd7b6]'
                        : 'bg-[#f6d9bf] text-[#8f4621]'
                      : darkMode
                        ? 'text-[#d9c4ad] hover:text-[#fff2df] hover:bg-[#3a3128]'
                        : 'text-[#6b5845] hover:text-[#3f3022] hover:bg-[#f4e8d7]'
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
