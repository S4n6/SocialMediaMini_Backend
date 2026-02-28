import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthenticatedSocket } from '../core/interfaces';

/**
 * WebSocket Authentication Guard
 *
 * Checks that the socket has been authenticated during the connection
 * handshake (handled by MainGateway.handleConnection).
 *
 * Usage:
 *   @UseGuards(WsAuthGuard)
 *   @SubscribeMessage('event:name')
 *   async handleEvent(@ConnectedSocket() client: AuthenticatedSocket) { ... }
 *
 * This is a lightweight check — the heavy JWT verification happens once
 * at connection time. This guard simply asserts the result persists.
 */
@Injectable()
export class WsAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<AuthenticatedSocket>();
    return !!client.userId;
  }
}
