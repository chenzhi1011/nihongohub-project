import { AppError, createOperationId } from '../errors/appError';
import { toAppError } from './apiError';
import { supabase, type AppSupabaseClient } from './supabaseClient';

export type DailyCheckinResult = 'checked' | 'already_checked';

function requireClient(client: AppSupabaseClient | null, operationId: string): AppSupabaseClient {
  if (client) return client;
  throw new AppError({
    code: 'UNKNOWN',
    message: 'Supabase 尚未配置',
    operationId,
    retryable: false,
  });
}

export function createDailyCheckinApi(client: AppSupabaseClient | null) {
  async function run<T>(operation: (configured: AppSupabaseClient) => Promise<T>): Promise<T> {
    const operationId = createOperationId();
    try {
      return await operation(requireClient(client, operationId));
    } catch (error) {
      throw toAppError(error, operationId);
    }
  }

  return {
    fetchMonthlyCheckins(startDate: string, endDateExclusive: string): Promise<string[]> {
      return run(async (configured) => {
        const { data, error } = await configured
          .from('daily_checkins')
          .select('checkin_date')
          .gte('checkin_date', startDate)
          .lt('checkin_date', endDateExclusive);
        if (error) throw error;
        return (data ?? []).map((row) => row.checkin_date);
      });
    },

    checkInToday(localDate: string): Promise<DailyCheckinResult> {
      return run(async (configured) => {
        const { data, error } = await configured.rpc('check_in_today', {
          p_checkin_date: localDate,
        });
        if (error) throw error;
        if (data !== 'checked' && data !== 'already_checked') {
          throw new Error('Invalid daily check-in result');
        }
        return data;
      });
    },
  };
}

const dailyCheckinApi = createDailyCheckinApi(supabase);

export const fetchMonthlyCheckins = dailyCheckinApi.fetchMonthlyCheckins;
export const checkInToday = dailyCheckinApi.checkInToday;
