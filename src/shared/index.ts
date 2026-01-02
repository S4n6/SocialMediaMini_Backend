/**
 * Shared Module Exports
 * Base utilities, guards, decorators for all modules
 */

// Domain layer - Base classes for domain entities
export * from './domain/entity.base';
export * from './domain/domain-event.base';
export * from './domain/base-id';

// Exceptions - Domain and application exceptions
export * from './exceptions/domain.exception';
export * from './exceptions/error-response.interface';

// Constants - Shared constants
export * from './constants';

// Guards - Authentication and authorization
export * from './guards/jwt.guard';
export * from './guards/google.guard';
export * from './guards/roles.guard';

// Decorators - Custom decorators
export * from './decorators/currentUser.decorator';
export * from './decorators/roles.decorator';
export * from './decorators/skipGuard.decorator';

// Filters - Exception filters
export * from './filters';

// Middlewares - HTTP middlewares
export * from './middlewares';

// Utils - Utility functions and interfaces
export * from './utils';
