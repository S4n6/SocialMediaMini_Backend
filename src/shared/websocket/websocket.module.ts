import { Module, Global } from '@nestjs/common';
import { ConnectionManagerService } from './core/connection-manager.service';
import { RoomManagerService } from './core/room-manager.service';
import { WebSocketGatewayService } from './core/websocket-gateway.service';
import { WebSocketConnectionService } from './core/websocket-connection.service';
import { WebSocketEmitterService } from './core/websocket-emitter.service';
import { WebSocketUtilityService } from './core/websocket-utility.service';
import { MessagingWebSocketService } from './services/messaging-websocket.service';
import { SocialWebSocketService } from './services/social-websocket.service';
import { PresenceWebSocketService } from './services/presence-websocket.service';

@Global()
@Module({
  providers: [
    // Core services
    ConnectionManagerService,
    RoomManagerService,
    WebSocketGatewayService,

    // New extracted services
    WebSocketConnectionService,
    WebSocketEmitterService,
    WebSocketUtilityService,

    // Feature-specific services
    MessagingWebSocketService,
    SocialWebSocketService,
    PresenceWebSocketService,
  ],
  exports: [
    // Core services
    ConnectionManagerService,
    RoomManagerService,
    WebSocketGatewayService,

    // New extracted services
    WebSocketConnectionService,
    WebSocketEmitterService,
    WebSocketUtilityService,

    // Feature-specific services for other modules to use
    MessagingWebSocketService,
    SocialWebSocketService,
    PresenceWebSocketService,
  ],
})
export class WebSocketModule {}
