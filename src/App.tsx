import React, { useState } from 'react';
import { Search, Menu, X, ExternalLink, Moon, Sun, Globe } from 'lucide-react';
import { categories, todaysPhrases, translations, Resource, Category } from './data';
import { Analytics } from '@vercel/analytics/react';

function App() {
  const [activeCategory, setActiveCategory] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<'zh' | 'jp'>('jp'); // Default to jp
  const [todaysPhrase] = useState(todaysPhrases[Math.floor(Math.random() * todaysPhrases.length)]);

  // Translation helper function
  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  const filteredResources = () => {
    if (!searchQuery) return [];
    
    const results: Array<Resource & { categoryName: string }> = [];
    categories.forEach(category => {
      category.resources.forEach(resource => {
        if (resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) {
          results.push({ ...resource, categoryName: t(category.nameKey) });
        }
      });
    });
    return results;
  };

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    setMobileMenuOpen(false);
  };

  const getTagColor = (tag: string) => {
    if (darkMode) {
      if (tag === 'beginner') return 'bg-green-900 text-green-200';
      if (tag === 'intermediate') return 'bg-yellow-900 text-yellow-200';
      if (tag === 'advanced') return 'bg-red-900 text-red-200';
      if (tag === 'free') return 'bg-blue-900 text-blue-200';
      if (tag === 'premium') return 'bg-purple-900 text-purple-200';
      if (tag === 'grammar') return 'bg-pink-900 text-pink-200';
      if (tag === 'pronunciation') return 'bg-indigo-900 text-indigo-200';
      if (tag === 'phrase') return 'bg-teal-900 text-teal-200';
      if (tag === 'all levels') return 'bg-gray-800 text-gray-100';
      if (tag === 'structured') return 'bg-amber-900 text-amber-200';
      if (tag === 'news') return 'bg-cyan-900 text-cyan-200';
      if (tag === 'video') return 'bg-orange-900 text-orange-200';
      if (tag === 'podcast') return 'bg-rose-900 text-rose-200';
      if (tag === 'lecture') return 'bg-lime-900 text-lime-200';
      if (tag === 'paper') return 'bg-sky-900 text-sky-200';
      if (tag === 'dictionary') return 'bg-stone-900 text-stone-200';
      if (tag === 'writing') return 'bg-fuchsia-900 text-fuchsia-200';
      return 'bg-gray-700 text-gray-200';
    } else {
      if (tag === 'beginner') return 'bg-green-100 text-green-800';
      if (tag === 'intermediate') return 'bg-yellow-100 text-yellow-800';
      if (tag === 'advanced') return 'bg-red-100 text-red-800';
      if (tag === 'free') return 'bg-blue-100 text-blue-800';
      if (tag === 'premium') return 'bg-purple-100 text-purple-800';
      if (tag === 'grammar') return 'bg-pink-100 text-pink-800';
      if (tag === 'pronunciation') return 'bg-indigo-100 text-indigo-800';
      if (tag === 'phrase') return 'bg-teal-100 text-teal-800';
      if (tag === 'all levels') return 'bg-gray-100 text-gray-800';
      if (tag === 'structured') return 'bg-amber-100 text-amber-800';
      if (tag === 'news') return 'bg-cyan-100 text-cyan-800';
      if (tag === 'video') return 'bg-orange-100 text-orange-800';
      if (tag === 'podcast') return 'bg-rose-100 text-rose-800';
      if (tag === 'lecture') return 'bg-lime-100 text-lime-800';
      if (tag === 'paper') return 'bg-sky-100 text-sky-800';
      if (tag === 'dictionary') return 'bg-stone-100 text-stone-800';
      if (tag === 'writing') return 'bg-fuchsia-100 text-fuchsia-800';
      return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`shadow-sm border-b transition-colors duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 relative">
            {/*logo */}
            <div className="flex items-center">
              <button
                onClick={() => setActiveCategory('home')}
                className={`whitespace-nowrap text-xl font-bold transition-colors ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
              >
                {t('title')}
              </button>
            </div>
          
              
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      activeCategory === category.id
                        ? darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-700'
                        : darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="text-center leading-tight break-words w-[41px]">{t(category.nameKey)}</span>
                  </button>
                );
              })}
            </nav>
            {/* Controls */}
            <div className="flex items-center space-x-4">
              {/* Language Toggle */}
              <button
                onClick={() => setLanguage(language === 'zh' ? 'jp' : 'zh')}
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
              
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className={`lg:hidden border-t transition-colors duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="px-2 pt-2 pb-3 space-y-1">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className={`flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      activeCategory === category.id
                        ? darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-700'
                        : darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-lg mx-auto">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
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

        {/* Search Results */}
        {searchQuery && (
          <div className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('searchResults')}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredResources().map((resource, index) => (
                <div key={index} className={`rounded-lg shadow-sm border p-4 hover:shadow-md transition-all duration-200 ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{resource.name}</h3>
                    <ExternalLink className={`w-4 h-4 flex-shrink-0 ml-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  </div>
                  <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{resource.description}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {resource.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getTagColor(tag)}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('from')}{resource.categoryName}</p>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-sm font-medium transition-colors ${
                      darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    {t('visitResource')} →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Home Page */}
        {activeCategory === 'home' && !searchQuery && (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="text-center">
              <h1 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {t('welcomeTitle')}
              </h1>
              <p className={`text-xl max-w-2xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {t('welcomeDesc')}
              </p>
            </div>

            {/* Today's Phrase */}
            <div className={`rounded-lg p-6 text-white transition-all duration-300 ${
              darkMode 
                ? 'bg-gradient-to-r from-blue-600 to-purple-700' 
                : 'bg-gradient-to-r from-blue-500 to-purple-600'
            }`}>
              <h2 className="text-2xl font-bold mb-4">{language === 'zh' ? '今日短语' : '今日の単語'} </h2>
              <div className="space-y-2">
                <p className="text-3xl font-bold">{todaysPhrase.japanese}</p>
                <p className="text-lg italic">{todaysPhrase.romaji}</p>
                {/* <p className="text-lg">{todaysPhrase.english}</p> */}
              </div>
            </div>

            {/* Category Overview */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className={`rounded-lg shadow-sm border p-4 hover:shadow-md transition-all duration-200 text-left ${
                      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <IconComponent className={`w-6 h-6 mr-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t(category.nameKey)}</h3>
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {category.resources.length} {t('resourcesAvailable')}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Pages */}
        {activeCategory !== 'home' && !searchQuery && (
          <div>
            {categories.map((category) => {
              if (category.id !== activeCategory) return null;
              
              const IconComponent = category.icon;
              return (
                <div key={category.id}>
                  <div className="flex items-center mb-6">
                    <IconComponent className={`w-8 h-8 mr-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t(category.nameKey)}</h1>
                  </div>
                  
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {category.resources.map((resource, index) => (
                      <div key={index} className={`rounded-lg shadow-sm border p-4 hover:shadow-md transition-all duration-200 ${
                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{resource.name}</h3>
                          <ExternalLink className={`w-5 h-5 flex-shrink-0 ml-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        </div>
                        <p className={`mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{resource.description}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {resource.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className={`px-3 py-1 text-sm font-medium rounded-full ${getTagColor(tag)}`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center font-medium transition-colors ${
                            darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                          }`}
                        >
                          {t('visitResource')}
                          <ExternalLink className="w-4 h-4 ml-1" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t mt-12 transition-colors duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <p>{t('footerText')}</p>
            <p className="mt-2 text-sm">{t('footerEncouragement')}</p>
          </div>
        </div>
      </footer>
      <Analytics />
    </div>
  );
}

export default App;