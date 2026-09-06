import type { Resource } from '../data/types';
import { supabase } from './supabaseClient';

export type UserResourcesByCategoryId = Record<string, Resource[]>;

type UserResourceRow = {
  category_id: unknown;
  name: unknown;
  description: unknown;
  url: unknown;
  tags: unknown;
};

function mapDbRowToResource(row: UserResourceRow): Resource {
  return {
    name: String(row.name ?? ''),
    description: String(row.description ?? ''),
    url: String(row.url ?? ''),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
  };
}

export async function fetchUserResourcesByCategoryId(userId: string): Promise<UserResourcesByCategoryId> {
  if (!supabase) throw new Error('Supabase 未配置');

  const { data, error } = await supabase
    .from('user_resources')
    .select('category_id,name,description,url,tags')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const result: UserResourcesByCategoryId = {};
  for (const row of (data ?? []) as UserResourceRow[]) {
    const categoryId = String(row.category_id ?? '');
    if (!result[categoryId]) result[categoryId] = [];
    result[categoryId].push(mapDbRowToResource(row));
  }
  return result;
}

export async function insertUserResource(params: {
  userId: string;
  categoryId: string;
  resource: Resource;
  isPrivate?: boolean;
}): Promise<void> {
  if (!supabase) throw new Error('Supabase 未配置');

  const { userId, categoryId, resource, isPrivate = true } = params;

  const { error } = await supabase.from('user_resources').insert({
    user_id: userId,
    category_id: categoryId,
    name: resource.name,
    description: resource.description,
    url: resource.url,
    tags: resource.tags,
    private: isPrivate,
  });

  if (error) throw error;
}

export async function getCheckinStatus(params: {
  userId: string;
  checkinDate: string; // YYYY-MM-DD
}): Promise<boolean> {
  if (!supabase) throw new Error('Supabase 未配置');
  const { userId, checkinDate } = params;

  const { data, error } = await supabase
    .from('checkins')
    .select('id')
    .eq('user_id', userId)
    .eq('checkin_date', checkinDate)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function checkInToday(params: {
  userId: string;
  checkinDate: string; // YYYY-MM-DD
}): Promise<boolean> {
  if (!supabase) throw new Error('Supabase 未配置');
  const { userId, checkinDate } = params;

  // 先查是否已存在，避免 unique 冲突报错给用户
  const already = await getCheckinStatus({ userId, checkinDate });
  if (already) return false;

  const { error } = await supabase.from('checkins').insert({
    user_id: userId,
    checkin_date: checkinDate,
  });
  if (error) throw error;

  return true;
}
