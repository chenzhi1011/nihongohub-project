import { Search } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { FeedbackFab } from './components/FeedbackFab';
import { UpdateNotice } from './components/UpdateNotice';
import { useHubApp } from './hooks/useHubApp';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { CategoryPage } from './pages/CategoryPage';
import { HomePage } from './pages/HomePage';
import { SearchResults } from './pages/SearchResults';

function App() {
  const {
    user,
    loading: authLoading,
    signOut,
  } = useSupabaseAuth();

  const userId = user?.id ?? null;
  const userEmail = user?.email ?? null;

  const {
    categoryList,
    activeCategory,
    searchQuery,
    setSearchQuery,
    mobileMenuOpen,
    setMobileMenuOpen,
    darkMode,
    setDarkMode,
    language,
    setLanguage,
    todaysPhrase,
    t,
    filteredResources,
    handleCategoryClick,
  } = useHubApp({ userId });

  const activeCategoryData = categoryList.find((c) => c.id === activeCategory);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#1f1b16]' : 'bg-[#f7f1e6]'}`}>
      <Header
        categories={categoryList}
        activeCategory={activeCategory}
        darkMode={darkMode}
        language={language}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((o) => !o)}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        onToggleLanguage={() => setLanguage((l) => (l === 'zh' ? 'jp' : 'zh'))}
        onCategoryClick={handleCategoryClick}
        onLogoClick={() => handleCategoryClick('home')}
        t={t}
        userEmail={userEmail}
        authLoading={authLoading}
        onSignOut={signOut}
      />

      {activeCategory === 'home' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <UpdateNotice darkMode={darkMode} language={language} />
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="relative max-w-lg mx-auto">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                darkMode ? 'text-[#8b7f6f]' : 'text-[#a89a85]'
              }`}
            />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#c86b3c] focus:border-transparent transition-colors duration-200 ${
                darkMode
                  ? 'bg-[#2a241d] border-[#4a3f33] text-[#f5ead8] placeholder-[#8f7f69]'
                  : 'bg-[#fffaf0] border-[#d7c7ae] text-[#33261a] placeholder-[#8f7f69]'
              }`}
            />
          </div>
        </div>

        {searchQuery && <SearchResults results={filteredResources} darkMode={darkMode} t={t} />}

        {activeCategory === 'home' && !searchQuery && (
          <HomePage
            categories={categoryList}
            darkMode={darkMode}
            language={language}
            todaysPhrase={todaysPhrase}
            onCategoryClick={handleCategoryClick}
            t={t}
          />
        )}

        {activeCategory !== 'home' && !searchQuery && activeCategoryData && (
          <CategoryPage
            category={activeCategoryData}
            darkMode={darkMode}
            t={t}
          />
        )}
      </main>

      <Footer darkMode={darkMode} t={t} />
      <Analytics />
      <FeedbackFab darkMode={darkMode} t={t} />
    </div>
  );
}

export default App;
