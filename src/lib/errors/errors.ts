// src/lib/errors/application.ts
import { ApplicationError } from './base';

//In this file I add all possible CUSTOM ERRORS that I can throw in my controllers to then be handled by handleApiError() function in the catch(error), (found in handlers.ts)

// ============ Database Errors ============
export class DatabaseError extends ApplicationError {
  statusCode = 500;
  code = 'DATABASE_ERROR';
}

export class RecordNotFoundError extends ApplicationError {
  statusCode = 404;
  code = 'RECORD_NOT_FOUND';
  
  constructor(resource: string, identifier?: string | number, cause?: unknown) {
    const message = identifier 
      ? `${resource} with identifier ${identifier} not found`
      : `${resource} not found`;
    super(message, cause, { resource, identifier });
  }
}

export class DuplicateRecordError extends ApplicationError {
  statusCode = 409;
  code = 'DUPLICATE_RECORD';
  
  constructor(resource: string, fields: string[], cause?: unknown) {
    super(
      `${resource} with these ${fields.join(', ')} already exists`,
      cause,
      { resource, fields }
    );
  }
}

export class ForeignKeyConstraintError extends ApplicationError {
  statusCode = 400;
  code = 'FOREIGN_KEY_CONSTRAINT';
  
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

// ============ Validation Errors ============
export class ValidationError extends ApplicationError {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  
  constructor(message: string, field?: string, cause?: unknown) {
    super(message, cause, { field });
  }
}

// ============ Resource Locked Errors ============
export class ResourceLockedError extends ApplicationError {
  statusCode = 423;
  code = 'RESOURCE_LOCKED_ERROR';
  
  constructor(message: string, field?: string, cause?: unknown) {
    super(message, cause, { field });
  }
}
export class InvalidDateRangeError extends ValidationError {
  constructor(message: string = 'Start date must be before end date') {
    super(message);
    this.code = 'INVALID_DATE_RANGE';
  }
}

// ============ Business Logic Errors ============\
// General Business Logic errors
export class BusinessRuleError extends ApplicationError {
  statusCode = 422;
  code = 'BUSINESS_RULE_VIOLATION';
}

export class ConflictError extends ApplicationError {
  statusCode = 409;
  code = 'CONFLICT';
}

// ============ Absence Domain Errors ============
export class AbsenceOverlapError extends ConflictError {
  constructor(existingAbsences: string, dateRange: string) {
    super(
      `Selected date range "${dateRange}" overlaps with other absences: ${existingAbsences}`,
      undefined,
      { dateRange, existingAbsences }
    );
    this.code = 'ABSENCE_OVERLAP';
  }
}

// ============ Work Hours/Timesheet Domain Errors ============
export class WorkHoursConflictError extends ConflictError {
  constructor(dateRange: string) {
    super(
      `Cannot create absence. Employee has been already working within the selected range "${dateRange}". Please remove work hours before creating absence.`,
      undefined,
      { dateRange }
    );
    this.code = 'WORK_HOURS_CONFLICT';
  }
}

export class TimesheetLockedError extends ResourceLockedError {
  constructor() {
    super(
      `Timesheet for this month is locked`,
      undefined
    );
    this.code = 'TIMESHEET_LOCKED';
  }
}

// ============ User Domain Errors ============

// ============ Authentication/Authorization Errors ============
export class AuthenticationError extends ApplicationError {
  statusCode = 401;
  code = 'AUTHENTICATION_ERROR';
}

export class AuthorizationError extends ApplicationError {
  statusCode = 403;
  code = 'AUTHORIZATION_ERROR';
}

// ============ External Service Errors ============
export class ServiceUnavailableError extends ApplicationError {
  statusCode = 503;
  code = 'SERVICE_UNAVAILABLE';
  
  constructor(serviceName: string, cause?: unknown) {
    super(`${serviceName} is temporarily unavailable`, cause, { serviceName });
  }
}

export class DatabaseConnectionError extends ServiceUnavailableError {
  statusCode = 503;
  code = 'DATABASE_CONNECTION_ERROR';
  
  constructor(cause?: unknown, poolMetadata?: { timeout?: number | string; connectionLimit?: number | string }) {
    super('Database', cause);
    
    // Check if it's a connection initialization error (can't reach server)
    if (cause && typeof cause === 'object' && 'message' in cause) {
      const errorMessage = String((cause as { message?: string }).message || '').toLowerCase();
      if (errorMessage.includes("can't reach database") || 
          errorMessage.includes("can not reach database") ||
          errorMessage.includes("connection refused") ||
          errorMessage.includes("connection timeout")) {
        // Extract database host/port if available
        const hostMatch = errorMessage.match(/(\d+\.\d+\.\d+\.\d+):(\d+)/);
        if (hostMatch) {
          this.message = `Cannot connect to database server at ${hostMatch[0]}. Please check: 1) DATABASE_URL environment variable is set correctly in Vercel, 2) Database server is running, 3) Database allows connections from Vercel's IP addresses.`;
        } else {
          this.message = `Cannot connect to database server. Please check: 1) DATABASE_URL environment variable is set correctly in Vercel, 2) Database server is running, 3) Database allows connections from Vercel's IP addresses.`;
        }
        this.metadata = {
          ...this.metadata,
          retryable: false, // Connection errors shouldn't be retried immediately
          action: 'check_environment_variables_and_firewall'
        };
        return;
      }
    }
    
    // Override message with more actionable information for pool exhaustion
    if (poolMetadata?.timeout && poolMetadata?.connectionLimit) {
      this.message = `Database connection pool exhausted. Timeout: ${poolMetadata.timeout}s, Limit: ${poolMetadata.connectionLimit} connections. Please retry.`;
    }
    
    // Add pool metadata for monitoring/alerting
    this.metadata = {
      ...this.metadata,
      ...poolMetadata,
      retryable: true,
      retryAfter: 5, // Suggest 5-second retry for pool exhaustion
      action: 'retry_with_backoff'
    };
  }
}

export class QueryTimeoutError extends ServiceUnavailableError {
  statusCode = 504; // Gateway Timeout
  code = 'QUERY_TIMEOUT';
  
  constructor(operation: string, cause?: unknown) {
    super('Database', cause);
    this.message = `Query timeout: ${operation} took too long to execute`;
  }
}

export class RateLimitError extends ApplicationError {
  statusCode = 429;
  code = 'RATE_LIMIT_EXCEEDED';
  
  constructor(limit: number, windowSeconds: number, cause?: unknown) {
    super(
      `Rate limit exceeded: ${limit} requests per ${windowSeconds} seconds`,
      cause,
      { 
        limit, 
        windowSeconds,
        retryable: true,
        retryAfter: windowSeconds // Client should wait full window
      }
    );
  }
}


