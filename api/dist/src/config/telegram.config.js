"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('telegram', () => ({
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    webhookUrl: process.env.TELEGRAM_BOT_WEBHOOK_URL,
    apiUrl: 'https://api.telegram.org',
}));
//# sourceMappingURL=telegram.config.js.map