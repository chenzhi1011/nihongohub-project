import type { AppError, AppErrorCode } from '../errors/appError';
import type { ResourceCategory, ResourceId } from '../types/resource';

export type ErrorEventContext = {
  event: string;
  operationId: string;
  errorCode: AppErrorCode;
  layer: 'api' | 'service' | 'hook' | 'ui';
  release: string;
  environment: 'development' | 'preview' | 'production';
  durationMs?: number;
  resourceId?: ResourceId;
  category?: ResourceCategory;
  checkinDate?: string;
  sessionTraceId?: string;
};

type ReportContext = Omit<ErrorEventContext, 'operationId' | 'errorCode'>;

export type ErrorReport = {
  error: AppError;
  context: ErrorEventContext;
};

type ErrorReporterProvider = (report: ErrorReport) => void;

let provider: ErrorReporterProvider | null = null;

export function configureErrorReporter(nextProvider: ErrorReporterProvider | null): void {
  provider = nextProvider;
}

export function reportError(error: AppError, context: ReportContext): void {
  if (!provider) return;

  try {
    provider({
      error,
      context: {
        ...context,
        operationId: error.operationId,
        errorCode: error.code,
      },
    });
  } catch {
    // Observability must never interrupt the user operation it is observing.
  }
}
