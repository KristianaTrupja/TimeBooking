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
  ConflictError,
  DatabaseConnectionError,
  QueryTimeoutError,
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
    if (error instanceof Prisma.PrismaClientKnownRequestError && 
        error.message.includes('Transaction API error')) {
      return new QueryTimeoutError('database transaction', error);
    }

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

    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      return new DatabaseError('An unknown database error occurred', error);
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

      case 'P2004':
        return new BusinessRuleError(
          `A constraint failed: ${error.meta?.database_error}`,
          error
        );

      case 'P2005':
        return new ValidationError(
          `Invalid stored value for field ${error.meta?.field_name}: expected type mismatch`,
          error.meta?.field_name as string,
          error
        );

      case 'P2006':
        return new ValidationError(
          `Invalid value provided for field ${error.meta?.field_name}: ${error.meta?.field_value}`,
          error.meta?.field_name as string,
          error
        );

      case 'P2007':
        return new ValidationError(
          `Data validation error: ${error.meta?.database_error}`,
          undefined,
          error
        );

      case 'P2010':
        return new DatabaseError(
          `Raw query failed: ${error.meta?.message}`,
          error
        );

      case 'P2011':
        return new ValidationError(
          `Null constraint violation on ${error.meta?.constraint}`,
          error.meta?.constraint as string,
          error
        );

      case 'P2012':
        return new ValidationError(
          `Missing required value at ${error.meta?.path}`,
          error.meta?.path as string,
          error
        );

      case 'P2013':
        return new ValidationError(
          `Missing required argument for field ${error.meta?.field_name} on ${error.meta?.object_name}`,
          error.meta?.field_name as string,
          error
        );

      case 'P2014':
        return new BusinessRuleError(
          `The change violates a required relation between ${error.meta?.model_a_name} and ${error.meta?.model_b_name}`,
          error
        );

      case 'P2015':
        return new RecordNotFoundError(
          'Related record',
          error.meta?.details as string,
          error
        );

      case 'P2016':
        return new ValidationError(
          `Query interpretation error: ${error.meta?.details}`,
          undefined,
          error
        );

      case 'P2017':
        return new BusinessRuleError(
          `Relations are not connected: ${error.meta?.relation_name} between ${error.meta?.parent_name} and ${error.meta?.child_name}`,
          error
        );

      case 'P2018':
        return new RecordNotFoundError(
          error.meta?.model_name as string || 'Related record',
          undefined,
          error
        );

      case 'P2019':
        return new ValidationError(
          'Input error in query',
          undefined,
          error
        );

      case 'P2020':
        return new ValidationError(
          `Value out of range for field ${error.meta?.field_name}`,
          error.meta?.field_name as string,
          error
        );

      case 'P2021':
        return new DatabaseError(
          `Table ${error.meta?.table} does not exist in the database`,
          error
        );

      case 'P2022':
        return new DatabaseError(
          `Column ${error.meta?.column} does not exist in the database`,
          error
        );

      case 'P2023':
        return new DatabaseError(
          'Inconsistent column data',
          error
        );

      case 'P2024': {
        // Connection pool timeout - critical for production
        const meta = error.meta as { timeout?: number; connection_limit?: number } | undefined;
        const timeout = meta?.timeout ?? 'unknown';
        const connectionLimit = meta?.connection_limit ?? 'unknown';
        return new DatabaseConnectionError(
          error,
          { timeout, connectionLimit }
        );
      }

      case 'P2025':
        return new RecordNotFoundError(
          error.meta?.modelName as string || 'Record',
          error.meta?.cause as string,
          error
        );

      case 'P2026':
        return new DatabaseError(
          `Database provider doesn't support this feature: ${error.meta?.feature}`,
          error
        );

      case 'P2027':
        return new DatabaseError(
          `Multiple database errors occurred during query execution`,
          error
        );

      case 'P2028':
        return new DatabaseError(
          `Transaction API error: ${error.meta?.error}`,
          error
        );

      case 'P2030':
        return new DatabaseError(
          'Cannot find a fulltext index to use for search',
          error
        );

      case 'P2033':
        return new ValidationError(
          `Number value is out of range for field ${error.meta?.field_name}`,
          error.meta?.field_name as string,
          error
        );

      case 'P2034':
        // Write conflict/deadlock - should be retryable
        return new ConflictError(
          'Transaction failed due to write conflict or deadlock. Please retry the operation.',
          error,
          { retryable: true }
        );

      default:
        return new DatabaseError(
          `Database operation failed: ${error.code} - ${error.message}`,
          error
        );
    }
  }

}
