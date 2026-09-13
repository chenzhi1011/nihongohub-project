import { useCallback, useRef, useState } from 'react';
import { submitFeedback as submitFeedbackRequest } from '../api/feedbackApi';
import { AppError } from '../errors/appError';
import { reportError } from '../observability/errorReporter';

export type FeedbackDependencies = {
  submitFeedback: typeof submitFeedbackRequest;
  now: () => number;
};

export type FeedbackState = {
  submitting: boolean;
  error: string | null;
  succeeded: boolean;
  submitFeedback: (content: string) => Promise<boolean>;
  clearFeedbackState: () => void;
};

const defaultDependencies: FeedbackDependencies = {
  submitFeedback: submitFeedbackRequest,
  now: () => performance.now(),
};

function resolveFeedbackMessage(error: unknown, t: (key: string) => string): string {
  if (!(error instanceof AppError)) return t('feedbackSubmitFailed');
  switch (error.code) {
    case 'AUTH_REQUIRED': return t('loginRequired');
    case 'VALIDATION_ERROR': return t('feedbackInvalidError');
    case 'FEEDBACK_RATE_LIMITED': return t('feedbackRateLimitError');
    case 'FEEDBACK_DAILY_LIMIT_REACHED': return t('feedbackDailyLimitError');
    default: return t('feedbackSubmitFailed');
  }
}

function reportFeedbackError(error: unknown, durationMs: number): void {
  if (!(error instanceof AppError)) return;
  const mode = import.meta.env.MODE;
  reportError(error, {
    event: 'feedback.submit.failed',
    layer: 'hook',
    release: import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA ?? 'local',
    environment: mode === 'production' ? 'production' : mode === 'preview' ? 'preview' : 'development',
    durationMs,
  });
}

export function useFeedback(
  t: (key: string) => string,
  dependencies: FeedbackDependencies = defaultDependencies,
): FeedbackState {
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const clearFeedbackState = useCallback(() => {
    setError(null);
    setSucceeded(false);
  }, []);

  const submitFeedback = useCallback(async (content: string): Promise<boolean> => {
    if (submittingRef.current) return false;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    setSucceeded(false);
    const startedAt = dependencies.now();

    try {
      await dependencies.submitFeedback(content);
      setSucceeded(true);
      return true;
    } catch (nextError) {
      setError(resolveFeedbackMessage(nextError, t));
      reportFeedbackError(nextError, Math.max(0, dependencies.now() - startedAt));
      return false;
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [dependencies, t]);

  return { submitting, error, succeeded, submitFeedback, clearFeedbackState };
}
