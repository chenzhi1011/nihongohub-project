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
import type { Resource } from '../data/types';
import { fetchUserResourcesByCategoryId, insertUserResource, type UserResourcesByCategoryId } from '../api/userDataApi';
import { saveUserResourcesByCategoryId } from '../service/userResourcesService';

export function useHubApp({ userId }: { userId: string | null }) {
  const navigate = useNavigate();
  const location = useLocation();

  const baseCategoryList = useMemo(() => catalogDataApi.fetchCategories(), []);
  const translationMap = useMemo(() => catalogDataApi.fetchTranslations(), []);

  const [userResourcesByCategoryId, setUserResourcesByCategoryId] = useState<UserResourcesByCategoryId>({});

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!userId) {
        setUserResourcesByCategoryId({});
        return;
      }
      const data = await fetchUserResourcesByCategoryId(userId);
      if (!cancelled) setUserResourcesByCategoryId(data);
    }

    run().catch(() => {
      // 获取失败时保持空的 user resources，让页面至少可用
      if (!cancelled) setUserResourcesByCategoryId({});
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const categoryList = useMemo(() => {
    return baseCategoryList.map((category) => {
      const userResources = userResourcesByCategoryId[category.id] ?? [];
      return {
        ...category,
        resources: [...category.resources, ...userResources],
      };
    });
  }, [baseCategoryList, userResourcesByCategoryId]);

  useEffect(() => {
    saveUserResourcesByCategoryId(userResourcesByCategoryId);
  }, [userResourcesByCategoryId]);

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

  const addUserResource = useCallback(
    async (categoryId: string, resource: Resource) => {
      if (!userId) return;
      await insertUserResource({
        userId,
        categoryId,
        resource,
        isPrivate: true,
      });
      const refreshed = await fetchUserResourcesByCategoryId(userId);
      setUserResourcesByCategoryId(refreshed);
    },
    [userId],
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
    addUserResource,
  };
}
