/**
 * Use Case Interface
 */
export interface UseCase<TRequest, TResponse> {
  execute(request: TRequest): Promise<TResponse>;
}

/**
 * Base Use Case Class
 * Provides common functionality for all use cases
 */
export abstract class BaseUseCase<TRequest, TResponse>
  implements UseCase<TRequest, TResponse>
{
  abstract execute(request: TRequest): Promise<TResponse>;

  /**
   * Validate input (to be implemented by subclasses if needed)
   */
  protected validateInput(request: TRequest): void {
    if (request === null || request === undefined) {
      throw new Error('Request cannot be null or undefined');
    }
  }
}

/**
 * Base Command Use Case
 * For operations that modify state
 */
export abstract class BaseCommand<TRequest, TResponse> extends BaseUseCase<
  TRequest,
  TResponse
> {}

/**
 * Base Query Use Case
 * For operations that read state
 */
export abstract class BaseQuery<TRequest, TResponse> extends BaseUseCase<
  TRequest,
  TResponse
> {}
