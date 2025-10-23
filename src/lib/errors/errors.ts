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
