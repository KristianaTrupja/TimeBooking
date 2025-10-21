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
  // Translate to application error
  const appError = ErrorAdapter.fromError(error);

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

  return NextResponse.json(response, { status: appError.statusCode });
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
