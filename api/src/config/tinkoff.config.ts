import { registerAs } from '@nestjs/config';

export default registerAs('tinkoff', () => ({
  terminalKey: process.env.TINKOFF_TERMINAL_KEY,
  secretKey: process.env.TINKOFF_SECRET_KEY,
  apiUrl: process.env.TINKOFF_API_URL || 'https://securepay.tinkoff.ru/v2/',
  isProduction: process.env.NODE_ENV === 'production',
}));
