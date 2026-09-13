import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { checkInToday, fetchMonthlyCheckins } from '../api/dailyCheckinApi';
import { AppError } from '../errors/appError';
import { reportError } from '../observability/errorReporter';
import {
  buildMonthlyCheckinCalendar,
  toLocalDateString,
  type MonthlyCheckinCalendarModel,
} from '../service/dailyCheckinService';

export type DailyCheckinDependencies = {
  fetchMonthlyCheckins: typeof fetchMonthlyCheckins;
  checkInToday: typeof checkInToday;
  now: () => Date;
};

export type DailyCheckinState = {
  calendar: MonthlyCheckinCalendarModel;
  loading: boolean;
  submitting: boolean;
  checkedToday: boolean;
  error: unknown;
  checkIn: () => Promise<void>;
  retry: () => Promise<void>;
};

const defaultDependencies: DailyCheckinDependencies = {
  fetchMonthlyCheckins,
  checkInToday,
  now: () => new Date(),
};

function reportCheckinError(error: unknown, event: string, checkinDate?: string): void {
  if (!(error instanceof AppError)) return;
  const mode = import.meta.env.MODE;
  reportError(error, {
    event,
    layer: 'hook',
    release: import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA ?? 'local',
    environment: mode === 'production' ? 'production' : mode === 'preview' ? 'preview' : 'development',
    checkinDate,
  });
}

export function useDailyCheckin(
  authenticated: boolean,
  userId: string | null,
  dependencies: DailyCheckinDependencies = defaultDependencies,
): DailyCheckinState {
  const requestVersion = useRef(0);
  const submittingRef = useRef(false);
  const [now, setNow] = useState(() => dependencies.now());
  const [checkedDates, setCheckedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(authenticated);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const calendar = useMemo(
    () => buildMonthlyCheckinCalendar(now, checkedDates),
    [checkedDates, now],
  );
  const today = toLocalDateString(now);
  const checkedToday = checkedDates.includes(today);

  const retry = useCallback(async (): Promise<void> => {
    if (!authenticated || !userId) return;
    const version = ++requestVersion.current;
    const requestNow = dependencies.now();
    const requestedCalendar = buildMonthlyCheckinCalendar(requestNow, []);
    setNow(requestNow);
    setLoading(true);
    setError(null);
    try {
      const dates = await dependencies.fetchMonthlyCheckins(
        requestedCalendar.startDate,
        requestedCalendar.endDateExclusive,
      );
      if (requestVersion.current === version) setCheckedDates(dates);
    } catch (nextError) {
      if (requestVersion.current === version) {
        setCheckedDates([]);
        setError(nextError);
        reportCheckinError(nextError, 'daily_checkins.fetch.failed');
      }
    } finally {
      if (requestVersion.current === version) setLoading(false);
    }
  }, [authenticated, dependencies, userId]);

  useEffect(() => {
    if (!authenticated || !userId) {
      requestVersion.current += 1;
      submittingRef.current = false;
      setNow(dependencies.now());
      setCheckedDates([]);
      setLoading(false);
      setSubmitting(false);
      setError(null);
      return;
    }
    void retry();
    return () => { requestVersion.current += 1; };
  }, [authenticated, dependencies, retry, userId]);

  const checkIn = useCallback(async (): Promise<void> => {
    if (!authenticated || !userId || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    const requestNow = dependencies.now();
    const localDate = toLocalDateString(requestNow);
    setNow(requestNow);
    try {
      await dependencies.checkInToday(localDate);
      setCheckedDates((current) => current.includes(localDate) ? current : [...current, localDate]);
    } catch (nextError) {
      setError(nextError);
      reportCheckinError(nextError, 'daily_checkin.create.failed', localDate);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [authenticated, dependencies, userId]);

  return { calendar, loading, submitting, checkedToday, error, checkIn, retry };
}
