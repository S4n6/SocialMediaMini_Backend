export const JWT = {
  SECRET: process.env.JWT_SECRET,
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  ACCESS_TOKEN_PREFIX: 'Bearer ',
  REFRESH_TOKEN_PREFIX: 'Bearer ',
} as const;
