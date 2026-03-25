import type { Resource } from '../data/types';

export type UserResourcesByCategoryId = Record<string, Resource[]>;

const STORAGE_KEY = 'nihongohub.userResourcesByCategoryId.v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function loadUserResourcesByCategoryId(): UserResourcesByCategoryId {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (!isRecord(parsed)) return {};

    // 轻量校验：确保每个 categoryId 对应的是数组
    const result: UserResourcesByCategoryId = {};
    for (const [categoryId, value] of Object.entries(parsed)) {
      if (Array.isArray(value)) {
        result[categoryId] = value as Resource[];
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function saveUserResourcesByCategoryId(data: UserResourcesByCategoryId): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage 可能被禁用/配额限制；不影响主流程
  }
}

export function addUserResourceToCategory(
  prev: UserResourcesByCategoryId,
  categoryId: string,
  resource: Resource,
): UserResourcesByCategoryId {
  const list = prev[categoryId] ?? [];
  return {
    ...prev,
    [categoryId]: [...list, resource],
  };
}

