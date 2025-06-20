"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TelegramAuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
let TelegramAuthService = TelegramAuthService_1 = class TelegramAuthService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(TelegramAuthService_1.name);
        this.botToken = this.configService.get('TELEGRAM_BOT_TOKEN');
        if (!this.botToken) {
            throw new Error('TELEGRAM_BOT_TOKEN is required');
        }
    }
    validateTelegramAuth(authData) {
        try {
            const { hash, ...dataToCheck } = authData;
            const authAge = Date.now() / 1000 - authData.auth_date;
            if (authAge > 300) {
                this.logger.warn('Telegram auth data is too old');
                throw new common_1.UnauthorizedException('Authentication data is too old');
            }
            const dataCheckString = Object.keys(dataToCheck)
                .filter(key => dataToCheck[key] !== undefined && dataToCheck[key] !== null)
                .sort()
                .map(key => `${key}=${dataToCheck[key]}`)
                .join('\n');
            const secretKey = (0, crypto_1.createHmac)('sha256', 'WebAppData').update(this.botToken).digest();
            const calculatedHash = (0, crypto_1.createHmac)('sha256', secretKey).update(dataCheckString).digest('hex');
            const isValid = calculatedHash === hash;
            if (!isValid) {
                this.logger.warn('Invalid Telegram authentication hash');
                throw new common_1.UnauthorizedException('Invalid authentication data');
            }
            this.logger.debug(`Telegram auth validated for user ${authData.id}`);
            return true;
        }
        catch (error) {
            this.logger.error('Telegram auth validation failed:', error.message);
            throw new common_1.UnauthorizedException('Authentication validation failed');
        }
    }
    extractUserData(authData) {
        return {
            telegramId: BigInt(authData.id),
            username: authData.username,
            firstName: authData.first_name,
            lastName: authData.last_name,
            photoUrl: authData.photo_url,
        };
    }
    generateChallenge() {
        return (0, crypto_1.createHmac)('sha256', this.botToken)
            .update(Math.random().toString())
            .digest('hex')
            .substring(0, 16);
    }
    verifyChallenge(challenge, response, telegramId) {
        const expectedResponse = (0, crypto_1.createHmac)('sha256', this.botToken)
            .update(`${challenge}:${telegramId}`)
            .digest('hex');
        return expectedResponse === response;
    }
};
exports.TelegramAuthService = TelegramAuthService;
exports.TelegramAuthService = TelegramAuthService = TelegramAuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TelegramAuthService);
//# sourceMappingURL=telegram-auth.service.js.map