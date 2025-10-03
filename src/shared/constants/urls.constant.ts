export const URLS = {
  FRONT_END_WEB: process.env.FRONTEND_URL || 'http://localhost:3000',
  BACK_END_API: process.env.BACKEND_URL || 'http://localhost:3107',
  GOOGLE_CALLBACK:
    process.env.GOOGLE_CALLBACK_URL ||
    'http://localhost:3107/auth/google/callback',
  FRONT_END_WEB_PRODUCTION:
    process.env.FRONTEND_URL_PRODUCTION || 'http://localhost:3000',
} as const;
