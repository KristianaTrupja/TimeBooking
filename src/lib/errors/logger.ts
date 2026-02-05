// src/lib/errors/logger.ts
import { ApplicationError } from './base';

interface LogContext {
  errorName: string;
  errorCode: string;
  statusCode: number;
  isOperational: boolean;
  requestId?: string;
  metadata?: Record<string, any>;
  cause?: unknown;
  stack?: string;
}

export function logError(error: ApplicationError, requestId?: string): void {
  const context: LogContext = {
    errorName: error.name,
    errorCode: error.code,
    statusCode: error.statusCode,
    isOperational: error.isOperational,
    requestId,
    metadata: error.metadata,
    cause: error.cause,
    // stack: error.stack,
  };

  if (error.isOperational) {
    // Operational errors - log as warnings
    console.warn('Operational Error:', {
      message: error.message,
      ...context,
    });
  } else {
    // Non-operational errors (programmer errors) - log as errors
    console.error('System Error:', {
      message: error.message,
      ...context,
    });

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send to Sentry, DataDog, etc.
      // captureException(error, { extra: context });
    }
  }
}


