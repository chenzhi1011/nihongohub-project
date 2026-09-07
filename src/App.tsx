import { Search } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AuthDialog } from './components/AuthDialog';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { FeedbackFab } from './components/FeedbackFab';
import { UpdateNotice } from './components/UpdateNotice';
import { useHubApp } from './hooks/useHubApp';
import { useCatalog } from './hooks/useCatalog';
import { useResourceActions } from './hooks/useResourceActions';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { CategoryPage } from './pages/CategoryPage';
import { HomePage } from './pages/HomePage';
import { SearchResults } from './pages/SearchResults';

function App() {
  const {
    user,
    loading: authLoading,
    error: authError,
    signInWithGoogle,
    signOut,
  } = useSupabaseAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const catalog = useCatalog();
  const retryCatalog = catalog.retry;
  const lastCatalogIdentity = useRef<string | null>();

  useEffect(() => {
    if (authLoading) return;
    const identity = user?.id ?? null;
    if (lastCatalogIdentity.current === undefined) {
      lastCatalogIdentity.current = identity;
      return;
    }
    if (lastCatalogIdentity.current !== identity) {
      lastCatalogIdentity.current = identity;
      void retryCatalog();
    }
  }, [authLoading, retryCatalog, user?.id]);

  const resourceActionDependencies = useMemo(() => ({ refreshSpace: retryCatalog }), [retryCatalog]);
  const resourceActions = useResourceActions(resourceActionDependencies);

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
    categoryCounts,
    handleCategoryClick,
  } = useHubApp(catalog.data);

  const activeCategoryMetadata = categoryList.find((category) => category.id === activeCategory);
  const activeCategoryData = catalog.data.find((section) => section.category === activeCategory);

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
        onOpenLogin={() => setAuthDialogOpen(true)}
        onOpenSpace={() => handleCategoryClick('space')}
        onSignOut={signOut}
      />

      <AuthDialog
        open={authDialogOpen}
        darkMode={darkMode}
        error={authError}
        t={t}
        onClose={() => setAuthDialogOpen(false)}
        onGoogleLogin={signInWithGoogle}
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

        {catalog.loading ? (
          <p role="status" className={darkMode ? 'text-[#d8c4ad]' : 'text-[#6b5845]'}>{t('catalogLoading')}</p>
        ) : catalog.error ? (
          <div role="alert" className={`rounded-lg border p-5 text-center ${darkMode ? 'border-[#70453e] bg-[#3b2925] text-[#ffd2ca]' : 'border-[#dfb7ae] bg-[#fff0ed] text-[#7d3027]'}`}>
            <p>{t('catalogLoadFailed')}</p>
            <button type="button" className="mt-3 underline" onClick={() => void catalog.retry()}>{t('retry')}</button>
          </div>
        ) : (
          <>
        {searchQuery && (
          <SearchResults
            results={filteredResources}
            darkMode={darkMode}
            t={t}
            authenticated={Boolean(user)}
            onToggleMark={(resourceId, marked) => void resourceActions.toggleMark(resourceId, marked)}
            onLoginRequired={() => setAuthDialogOpen(true)}
            onVisit={resourceActions.recordVisit}
            resolveMarked={resourceActions.resolveMarked}
            markPendingIds={resourceActions.markPendingIds}
          />
        )}

        {activeCategory === 'home' && !searchQuery && (
          <HomePage
            categories={categoryList}
            categoryCounts={categoryCounts}
            darkMode={darkMode}
            language={language}
            todaysPhrase={todaysPhrase}
            onCategoryClick={handleCategoryClick}
            t={t}
          />
        )}

        {activeCategory !== 'home' && !searchQuery && activeCategoryData && activeCategoryMetadata && (
          <CategoryPage
            category={activeCategoryData}
            metadata={activeCategoryMetadata}
            darkMode={darkMode}
            t={t}
            authenticated={Boolean(user)}
            onLoginRequired={() => setAuthDialogOpen(true)}
            onToggleMark={(resourceId, marked) => void resourceActions.toggleMark(resourceId, marked)}
            onVisit={resourceActions.recordVisit}
            resolveMarked={resourceActions.resolveMarked}
            markPendingIds={resourceActions.markPendingIds}
          />
        )}
          </>
        )}
      </main>

      <Footer darkMode={darkMode} t={t} />
      <Analytics />
      <FeedbackFab darkMode={darkMode} t={t} />
    </div>
  );
}

export default App;
