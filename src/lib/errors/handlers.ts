// src/lib/errors/handler.ts
import { NextResponse } from 'next/server';
import { ApplicationError, InternalError } from './base';
import { ErrorAdapter } from './adapter';
import { logError } from './logger';

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  requestId?: string;
  stack?: string;
  metadata?: Record<string, any>;
}

/**
 * Centralized error handler for Next.js API routes
 */
export function handleApiError(error: unknown, requestId?: string): NextResponse<ErrorResponse> {
  // Makes sure all catched errors are transformed to ApplicationError shape
  const appError: ApplicationError = ErrorAdapter.fromError(error);

  // Log the error
  logError(appError, requestId);

  // Build response
  const response: ErrorResponse = {
    error: appError.code,
    message: appError.message,
    statusCode: appError.statusCode,
    ...(requestId && { requestId }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: appError.stack,
      metadata: appError.metadata,
    }),
  };

  // Prepare headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add Retry-After header for retryable errors
  if (shouldAddRetryAfter(appError)) {
    const retryAfter = calculateRetryAfter(appError);
    headers['Retry-After'] = retryAfter.toString();
    
    // Optionally add custom header to indicate this is retryable
    if (process.env.NODE_ENV === 'development' || appError.metadata?.includeRetryHint) {
      response.metadata = {
        ...response.metadata,
        retryable: true,
        retryAfter,
      };
    }
  }

  return NextResponse.json(response, { 
    status: appError.statusCode,
    headers,
  });
}

/**
 * Determine if error should include Retry-After header
 */
function shouldAddRetryAfter(error: ApplicationError): boolean {
  // Add Retry-After for 503 Service Unavailable
  if (error.statusCode === 503) {
    return true;
  }

  // Add Retry-After for 429 Too Many Requests
  if (error.statusCode === 429) {
    return true;
  }

  // Add Retry-After if error explicitly marked as retryable
  if (error.metadata?.retryable === true) {
    return true;
  }

  return false;
}

/**
 * Calculate retry delay in seconds based on error type
 */
function calculateRetryAfter(error: ApplicationError): number {
  // Use custom retry delay if provided in metadata
  if (error.metadata?.retryAfter && typeof error.metadata.retryAfter === 'number') {
    return error.metadata.retryAfter;
  }

  // Default delays based on status code
  switch (error.statusCode) {
    case 503: // Service Unavailable (connection pool, maintenance)
      return 5; // 5 seconds - service might recover quickly
    case 429: // Too Many Requests
      return 60; // 60 seconds - rate limit cooldown
    default:
      return 3; // 3 seconds - generic retry delay
  }
}

/**
 * Type guard to check if error is operational
 */
export function isOperationalError(error: unknown): boolean {
  if (error instanceof ApplicationError) {
    return error.isOperational;
  }
  return false;
}
