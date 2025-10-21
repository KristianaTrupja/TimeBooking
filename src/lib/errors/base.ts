// src/lib/errors/base.ts
export interface IApplicationError {
  message: string;
  statusCode: number;
  code: string;
  isOperational: boolean;
  cause?: unknown;
  metadata?: Record<string, any>;
}

/**
 * Base error class for all application errors
 * Automatically sets the error name to the class name
 */
export abstract class ApplicationError extends Error implements IApplicationError {
  abstract statusCode: number
  abstract code: string
  isOperational = true
  cause?: unknown
  metadata?: Record<string, any>

  constructor(message: string, cause?: unknown, metadata?: Record<string, any>) {
    super(message)
    this.name = this.constructor.name
    this.cause = cause
    this.metadata = metadata
    
    // Maintains proper stack trace for where error was thrown (V8 only)
    Error.captureStackTrace(this, this.constructor)
    
    // Set the prototype explicitly for proper instanceof checks in TypeScript
    Object.setPrototypeOf(this, new.target.prototype)
  }

  /**
   * Serialize error for API responses
   */
  toJSON() {
    return {
      error: this.code,
      message: this.message,
      statusCode: this.statusCode,
      ...(process.env.NODE_ENV === 'development' && {
        stack: this.stack,
        cause: this.cause,
        metadata: this.metadata,
      }),
    };
  }
}

/**
 * For errors that should not be exposed to users
 * These indicate programmer errors or system failures
 */
export class InternalError extends ApplicationError {
  statusCode = 500;
  code = 'INTERNAL_ERROR';
  isOperational = false;
}
