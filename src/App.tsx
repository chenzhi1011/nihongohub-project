import { Search } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { FeedbackFab } from './components/FeedbackFab';
import { useHubApp } from './hooks/useHubApp';
import { CategoryPage } from './pages/CategoryPage';
import { HomePage } from './pages/HomePage';
import { SearchResults } from './pages/SearchResults';

function App() {
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
    addUserResource,
  } = useHubApp();

  const activeCategoryData = categoryList.find((c) => c.id === activeCategory);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
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
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="relative max-w-lg mx-auto">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`}
            />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                darkMode
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
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
            onAddResource={addUserResource}
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
