import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as catalogDataApi from '../api/catalogApi';
import { searchVisibleCatalog } from '../api/resourceCatalogApi';
import {
  makeTranslator,
  pickRandomPhrase,
  resolveActiveCategoryId,
} from '../service/catalogService';
import type { Language, TodaysPhrase } from '../data/types';
import type { CategoryCatalog } from '../types/resource';

export function useHubApp(catalog: CategoryCatalog[] = []) {
  const navigate = useNavigate();
  const location = useLocation();

  const baseCategoryList = useMemo(() => catalogDataApi.fetchCategories(), []);
  const translationMap = useMemo(() => catalogDataApi.fetchTranslations(), []);

  const categoryList = useMemo(() => baseCategoryList.map((category) => ({
    ...category,
    resources: catalog.find((section) => section.category === category.id)?.resources ?? [],
  })), [baseCategoryList, catalog]);
  const categoryCounts = useMemo(() => Object.fromEntries(
    catalog.map((section) => [section.category, section.totalCount]),
  ), [catalog]);

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
    () => searchVisibleCatalog(searchQuery, catalog).map((resource) => ({
      ...resource,
      categoryName: t(categoryList.find((category) => category.id === resource.category)?.nameKey ?? resource.category),
    })),
    [searchQuery, catalog, categoryList, t],
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
    categoryCounts,
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
