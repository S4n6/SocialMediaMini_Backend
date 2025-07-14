import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT ?? '587', 10),
  secure: process.env.MAIL_PORT === '465',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  from: {
    email: process.env.MAIL_FROM,
    name: process.env.MAIL_FROM_NAME || 'Social Media Mini',
  },
  tls: {
    rejectUnauthorized: false,
  },
}));
