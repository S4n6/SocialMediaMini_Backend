import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { SKIP_GUARDS_KEY } from 'src/decorators/skipGuard.decorator';


@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const skipGuards = this.reflector.getAllAndOverride<boolean>(SKIP_GUARDS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (skipGuards) {
      return true;
    }
    
    return super.canActivate(context);
  }
}