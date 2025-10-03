/**
 * Standard error response interface
 */
export interface IErrorResponse {
  /** HTTP status code */
  statusCode: number;

  /** Error message for the user */
  message: string;

  /** Unique error code for programmatic handling */
  code: string;

  /** Error type/category */
  error: string;

  /** Request timestamp */
  timestamp: string;

  /** Request path */
  path: string;

  /** Request ID for tracing */
  requestId?: string;

  /** Validation errors (for validation exceptions) */
  validationErrors?: Record<string, string[]>;

  /** Additional error details (only in development) */
  details?: Record<string, any>;

  /** Stack trace (only in development) */
  stack?: string;
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error categories for monitoring and analytics
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  BUSINESS_LOGIC = 'business_logic',
  DATABASE = 'database',
  EXTERNAL_SERVICE = 'external_service',
  FILE_OPERATION = 'file_operation',
  RATE_LIMIT = 'rate_limit',
  CONFIGURATION = 'configuration',
  SYSTEM = 'system',
  UNKNOWN = 'unknown',
}

/**
 * Error context for enhanced logging and monitoring
 */
export interface IErrorContext {
  /** User ID if available */
  userId?: string;

  /** Session ID if available */
  sessionId?: string;

  /** IP address */
  ipAddress?: string;

  /** User agent */
  userAgent?: string;

  /** Request method */
  method?: string;

  /** Request URL */
  url?: string;

  /** Request body (sanitized) */
  requestBody?: any;

  /** Request headers (sanitized) */
  headers?: Record<string, string>;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Complete error information for logging and monitoring
 */
export interface IErrorInfo {
  /** The error response sent to client */
  response: IErrorResponse;

  /** Error severity level */
  severity: ErrorSeverity;

  /** Error category */
  category: ErrorCategory;

  /** Request context */
  context: IErrorContext;

  /** Original error object */
  originalError?: Error;

  /** Should this error be reported to monitoring service */
  shouldReport?: boolean;
}
