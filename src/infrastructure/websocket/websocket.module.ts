import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RedisCacheModule } from '../../modules/cache';

// Core services
import { ConnectionManagerService } from './core/connection-manager.service';
import { RoomManagerService } from './core/room-manager.service';
import { WebSocketAuthService } from './core/websocket-auth.service';
import { PresenceService } from './core/presence.service';
import { MainGateway } from './core/websocket.gateway';

// Event system
import { WebSocketEventEmitter } from './events';

/**
 * WebSocket Infrastructure Module
 *
 * Provides core WebSocket functionality for the entire application:
 * - Connection management
 * - Room management
 * - Authentication
 * - Event emission system
 *
 * Feature modules (notification, messaging, comments) should:
 * 1. Import this module
 * 2. Inject WebSocketEventEmitter to emit events
 * 3. Create their own handlers in presentation/websocket layer
 */
@Global()
@Module({
  imports: [
    RedisCacheModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [
    // Core services
    ConnectionManagerService,
    RoomManagerService,
    WebSocketAuthService,
    PresenceService,

    // Event system
    WebSocketEventEmitter,

    // Main gateway
    MainGateway,
  ],
  exports: [
    // Export for use in feature modules
    ConnectionManagerService,
    RoomManagerService,
    WebSocketAuthService,
    PresenceService,
    WebSocketEventEmitter,
    MainGateway,
  ],
})
export class WebSocketModule {
  constructor() {
    console.log('\n🔌 WebSocket Infrastructure Module Initialized');
    console.log('========================================');
    console.log('✅ Connection Manager');
    console.log('✅ Room Manager');
    console.log('✅ WebSocket Auth');
    console.log('✅ Event Emitter');
    console.log('✅ WebSocket Gateway');
    console.log('========================================\n');
  }
}
