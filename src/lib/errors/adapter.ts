// src/lib/errors/translator.ts
import { Prisma } from '@prisma/client';
// import { ZodError } from 'zod';
// import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import {
  DatabaseError,
  RecordNotFoundError,
  DuplicateRecordError,
  ForeignKeyConstraintError,
  ValidationError,
  AuthenticationError,
  ServiceUnavailableError,
  BusinessRuleError,
} from './errors';
import { ApplicationError, InternalError } from './base';

export class ErrorAdapter {
  /**
   * Translates third-party library errors into application errors
   */
  static fromError(error: unknown): ApplicationError {
    // Already an application error - pass through
    if (error instanceof ApplicationError) {
      return error;
    }

    // Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return this.transformToPrismaError(error);
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return new ValidationError('Invalid data provided to database', undefined, error);
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return new ServiceUnavailableError('Database', error);
    }

    if (error instanceof Prisma.PrismaClientRustPanicError) {
      return new InternalError('Database engine panic occurred', error);
    }

    // // JWT errors
    // if (error instanceof TokenExpiredError) {
    //   return new AuthenticationError('Token has expired', error);
    // }

    // if (error instanceof JsonWebTokenError) {
    //   return new AuthenticationError('Invalid authentication token', error);
    // }

    // // Zod validation errors
    // if (error instanceof ZodError) {
    //   const firstError = error.errors[0];
    //   return new ValidationError(
    //     firstError.message,
    //     firstError.path.join('.'),
    //     error
    //   );
    // }

    // Network/Node errors
    if (error && typeof error === 'object' && 'code' in error) {
      const nodeError = error as NodeJS.ErrnoException;
      
      if (nodeError.code === 'ECONNREFUSED') {
        return new ServiceUnavailableError('External service', error);
      }
      
      if (nodeError.code === 'ETIMEDOUT') {
        return new ServiceUnavailableError('Request timed out', error);
      }
    }

    // Standard JavaScript errors
    if (error instanceof Error) {
      return new InternalError(error.message, error);
    }

    // Unknown error type
    return new InternalError('An unexpected error occurred', error);
  }

  /**
   * Translates Prisma-specific errors with detailed context
   */
  private static transformToPrismaError(error: Prisma.PrismaClientKnownRequestError): ApplicationError {
    switch (error.code) {
      case 'P2000':
        return new ValidationError(
          'The provided value is too long for the column',
          error.meta?.column_name as string,
          error
        );

      case 'P2001':
        return new RecordNotFoundError(
          error.meta?.model_name as string || 'Record',
          undefined,
          error
        );

      case 'P2002': {
        const target = (error.meta?.target as string[]) || [];
        const model = error.meta?.modelName as string || 'Record';
        return new DuplicateRecordError(model, target, error);
      }

      case 'P2003': {
        const field = error.meta?.field_name as string;
        return new ForeignKeyConstraintError(
          `Invalid reference: ${field}`,
          error
        );
      }

      case 'P2011':
        return new ValidationError(
          `Null constraint violation on ${error.meta?.constraint}`,
          error.meta?.constraint as string,
          error
        );

      case 'P2014':
        return new BusinessRuleError(
          'The change violates a required relation',
          error
        );

      case 'P2025':
        return new RecordNotFoundError(
          error.meta?.modelName as string || 'Record',
          undefined,
          error
        );

      default:
        return new DatabaseError(
          `Database operation failed: ${error.code}`,
          error,
          { code: error.code, meta: error.meta }
        );
    }
  }
}
