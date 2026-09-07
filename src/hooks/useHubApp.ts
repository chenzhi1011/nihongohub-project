import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as catalogDataApi from '../api/catalogApi';
import {
  makeTranslator,
  pickRandomPhrase,
  resolveActiveCategoryId,
  searchResources,
} from '../service/catalogService';
import type { Language, TodaysPhrase } from '../data/types';

export function useHubApp() {
  const navigate = useNavigate();
  const location = useLocation();

  const baseCategoryList = useMemo(() => catalogDataApi.fetchCategories(), []);
  const translationMap = useMemo(() => catalogDataApi.fetchTranslations(), []);

  const categoryList = baseCategoryList;

  const [activeCategory, setActiveCategory] = useState(() =>
    resolveActiveCategoryId(location.pathname, categoryList),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>('jp');
  const [todaysPhrase] = useState<TodaysPhrase>(() =>
    pickRandomPhrase(catalogDataApi.fetchTodaysPhrasePool()),
  );

  useEffect(() => {
    setActiveCategory(resolveActiveCategoryId(location.pathname, categoryList));
  }, [location.pathname, categoryList]);

  const t = useMemo(() => makeTranslator(translationMap, language), [translationMap, language]);

  const filteredResources = useMemo(
    () => searchResources(searchQuery, categoryList, (key) => t(key)),
    [searchQuery, categoryList, t],
  );

  const handleCategoryClick = useCallback(
    (categoryId: string) => {
      const newPath = categoryId === 'home' ? '/' : `/${categoryId}`;
      navigate(newPath);
      setActiveCategory(categoryId);
      setMobileMenuOpen(false);
    },
    [navigate],
  );

  return {
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
  };
}
