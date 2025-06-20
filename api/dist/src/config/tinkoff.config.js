"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('tinkoff', () => ({
    terminalKey: process.env.TINKOFF_TERMINAL_KEY,
    secretKey: process.env.TINKOFF_SECRET_KEY,
    apiUrl: process.env.TINKOFF_API_URL || 'https://securepay.tinkoff.ru/v2/',
    isProduction: process.env.NODE_ENV === 'production',
}));
//# sourceMappingURL=tinkoff.config.js.map