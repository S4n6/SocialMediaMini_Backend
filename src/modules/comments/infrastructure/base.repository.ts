/**
 * Base Repository Class
 *
 * Provides common infrastructure patterns for all repositories:
 * - Error handling and logging
 * - Query optimization utilities
 * - Transaction support
 * - Connection management
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma } from '../../../generated/prisma/client';

export interface DatabaseError extends Error {
  code?: string;
  meta?: any;
}

@Injectable()
export abstract class BaseRepository {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(protected readonly prisma: PrismaService) {}

  /**
   * Execute database operation with error handling and logging
   */
  protected async executeQuery<T>(
    operation: string,
    query: () => Promise<T>,
    context?: any,
  ): Promise<T> {
    const startTime = Date.now();

    try {
      this.logger.debug(`Executing ${operation}`, context);

      const result = await query();

      const duration = Date.now() - startTime;
      this.logger.debug(`${operation} completed in ${duration}ms`);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.handleDatabaseError(operation, error, duration, context);
      throw error;
    }
  }

  /**
   * Execute operations within a transaction
   */
  protected async executeTransaction<T>(
    operations: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.executeQuery('transaction', () =>
      this.prisma.$transaction(operations),
    );
  }

  /**
   * Handle and log database errors
   */
  private handleDatabaseError(
    operation: string,
    error: any,
    duration: number,
    context?: any,
  ): void {
    const dbError = error as DatabaseError;

    this.logger.error(`Database error in ${operation} (${duration}ms)`, {
      error: dbError.message,
      code: dbError.code,
      meta: dbError.meta,
      context,
      stack: dbError.stack,
    });

    // Transform Prisma errors to more user-friendly messages
    if (this.isPrismaError(dbError)) {
      this.transformPrismaError(dbError);
    }
  }

  /**
   * Check if error is a Prisma error
   */
  private isPrismaError(error: DatabaseError): boolean {
    return error.code !== undefined && error.code.startsWith('P');
  }

  /**
   * Transform Prisma errors to domain-friendly errors
   */
  private transformPrismaError(error: DatabaseError): void {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        error.message = 'A record with this data already exists';
        break;
      case 'P2025':
        // Record not found
        error.message = 'The requested record was not found';
        break;
      case 'P2003':
        // Foreign key constraint violation
        error.message = 'Referenced record does not exist';
        break;
      case 'P2014':
        // Required relation missing
        error.message = 'Required related record is missing';
        break;
      default:
        error.message = `Database operation failed: ${error.message}`;
    }
  }

  /**
   * Build pagination metadata
   */
  protected buildPaginationResult<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
  ): {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } {
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Validate pagination parameters
   */
  protected validatePagination(
    page: number,
    limit: number,
  ): { skip: number; take: number } {
    if (page < 1) {
      throw new Error('Page must be greater than 0');
    }
    if (limit < 1) {
      throw new Error('Limit must be greater than 0');
    }
    if (limit > 100) {
      throw new Error('Limit cannot exceed 100');
    }

    return {
      skip: (page - 1) * limit,
      take: limit,
    };
  }
}
