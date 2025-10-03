export interface UseCase<TRequest, TResponse> {
  execute(request: TRequest): Promise<TResponse>;
}

export abstract class BaseUseCase<TRequest, TResponse>
  implements UseCase<TRequest, TResponse>
{
  abstract execute(request: TRequest): Promise<TResponse>;
}
