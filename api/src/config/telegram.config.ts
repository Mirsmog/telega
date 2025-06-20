import { registerAs } from '@nestjs/config';

export default registerAs('telegram', () => ({
  botToken: process.env.TELEGRAM_BOT_TOKEN,
  webhookUrl: process.env.TELEGRAM_BOT_WEBHOOK_URL,
  apiUrl: 'https://api.telegram.org',
}));
