export interface ApiResponse<T = unknown> {
  data: T;
  message: string;
  success: boolean;
  statusCode?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Helper function to create successful responses
export function createSuccessResponse<T>(
  data: T,
  message: string = 'Operation completed successfully',
  statusCode?: number,
  pagination?: PaginationMeta,
): ApiResponse<T> {
  return {
    data,
    message,
    success: true,
    statusCode,
    pagination,
  };
}

// Helper function to create error responses
export function createErrorResponse<T = null>(
  message: string,
  statusCode?: number,
  data: T = null as T,
): ApiResponse<T> {
  return {
    data,
    message,
    success: false,
    statusCode,
  };
}
