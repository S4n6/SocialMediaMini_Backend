import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import {
  ConnectionManagerService,
  RoomManagerService,
  WebSocketAuthService,
  WebSocketHandlerRegistry,
  WebSocketEventDispatcher,
  WebSocketHealthService,
} from './application/services';
import { MainWebSocketGateway } from './websocket.gateway';
import { RedisCacheModule } from '../../modules/cache';

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
    WebSocketHandlerRegistry,
    WebSocketEventDispatcher,
    WebSocketHealthService,

    // Main gateway
    MainWebSocketGateway,
  ],
  exports: [
    // Export services for use in other modules
    ConnectionManagerService,
    RoomManagerService,
    WebSocketAuthService,
    WebSocketHandlerRegistry,
    WebSocketEventDispatcher,
    WebSocketHealthService,
    MainWebSocketGateway,
  ],
})
export class WebSocketModule {
  constructor(
    private readonly handlerRegistry: WebSocketHandlerRegistry,
    private readonly healthService: WebSocketHealthService,
  ) {
    this.logModuleInitialization();
  }

  private logModuleInitialization(): void {
    console.log('\n🚀 WebSocket Module Initialized');
    console.log('=====================================');
    console.log('✅ Connection Manager Service');
    console.log('✅ Room Manager Service');
    console.log('✅ WebSocket Auth Service');
    console.log('✅ Handler Registry Service');
    console.log('✅ Event Dispatcher Service');
    console.log('✅ Health Check Service');
    console.log('✅ Main WebSocket Gateway');
    console.log('=====================================');
    console.log('🔌 WebSocket server is ready to accept connections');
    console.log(`📊 Monitoring available at /websocket/health`);
    console.log('=====================================\n');
  }

  async onModuleInit() {
    // Log registry state on startup
    setTimeout(() => {
      this.handlerRegistry.logRegistryState();
    }, 1000);
  }
}
