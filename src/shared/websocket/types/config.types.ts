// Configuration types
export interface WebSocketModuleConfig {
  cors?: {
    origin: string | string[] | boolean;
    credentials?: boolean;
    methods?: string[];
  };
  maxConnections?: number;
  connectionTimeout?: number;
  heartbeatInterval?: number;
  maxPayloadSize?: number;
  enableCompression?: boolean;
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
}

// Handler registration config
export interface HandlerConfig {
  eventName: string;
  handler: any;
  module: string;
  priority?: number;
  middleware?: string[];
  rateLimit?: {
    max: number;
    windowMs: number;
  };
}

// Rate limiting
export interface RateLimit {
  max: number;
  windowMs: number;
  keyGenerator?: (socket: any) => string;
  onLimitReached?: (socket: any) => void;
}

// Middleware types
export type WebSocketMiddleware = (
  socket: any,
  next: (err?: Error) => void,
) => void;

// Error types
export interface WebSocketError extends Error {
  code: string;
  statusCode?: number;
  details?: any;
  timestamp: Date;
}

// Health check
export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  connections: {
    total: number;
    healthy: number;
  };
  rooms: {
    total: number;
    active: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
  lastCheck: Date;
}
