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
var RedisTokenService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisTokenService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
let RedisTokenService = RedisTokenService_1 = class RedisTokenService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(RedisTokenService_1.name);
        this.REFRESH_TOKEN_PREFIX = 'refresh_token:';
        this.BLACKLIST_PREFIX = 'blacklist:';
        this.redis = new ioredis_1.default({
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
            password: this.configService.get('REDIS_PASSWORD'),
            db: this.configService.get('REDIS_DB', 0),
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        });
        this.redis.on('connect', () => {
            this.logger.log('Connected to Redis');
        });
        this.redis.on('error', error => {
            this.logger.error('Redis connection error:', error);
        });
    }
    async storeRefreshToken(tokenId, userId, expiresIn) {
        const key = `${this.REFRESH_TOKEN_PREFIX}${tokenId}`;
        try {
            await this.redis.setex(key, expiresIn, userId);
            this.logger.debug(`Stored refresh token ${tokenId} for user ${userId}`);
        }
        catch (error) {
            this.logger.error(`Failed to store refresh token: ${error.message}`);
            throw error;
        }
    }
    async validateRefreshToken(tokenId) {
        const key = `${this.REFRESH_TOKEN_PREFIX}${tokenId}`;
        try {
            const userId = await this.redis.get(key);
            return userId;
        }
        catch (error) {
            this.logger.error(`Failed to validate refresh token: ${error.message}`);
            return null;
        }
    }
    async revokeRefreshToken(tokenId) {
        const key = `${this.REFRESH_TOKEN_PREFIX}${tokenId}`;
        try {
            await this.redis.del(key);
            this.logger.debug(`Revoked refresh token ${tokenId}`);
        }
        catch (error) {
            this.logger.error(`Failed to revoke refresh token: ${error.message}`);
            throw error;
        }
    }
    async revokeAllUserTokens(userId) {
        try {
            const pattern = `${this.REFRESH_TOKEN_PREFIX}*`;
            const keys = await this.redis.keys(pattern);
            if (keys.length === 0) {
                return;
            }
            const pipeline = this.redis.pipeline();
            keys.forEach(key => pipeline.get(key));
            const results = await pipeline.exec();
            const tokensToRevoke = [];
            results?.forEach((result, index) => {
                if (result && result[1] === userId) {
                    tokensToRevoke.push(keys[index]);
                }
            });
            if (tokensToRevoke.length > 0) {
                await this.redis.del(...tokensToRevoke);
                this.logger.debug(`Revoked ${tokensToRevoke.length} tokens for user ${userId}`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to revoke user tokens: ${error.message}`);
            throw error;
        }
    }
    async blacklistToken(jti, expiresIn) {
        const key = `${this.BLACKLIST_PREFIX}${jti}`;
        try {
            await this.redis.setex(key, expiresIn, 'blacklisted');
            this.logger.debug(`Blacklisted token ${jti}`);
        }
        catch (error) {
            this.logger.error(`Failed to blacklist token: ${error.message}`);
            throw error;
        }
    }
    async isTokenBlacklisted(jti) {
        const key = `${this.BLACKLIST_PREFIX}${jti}`;
        try {
            const result = await this.redis.get(key);
            return result !== null;
        }
        catch (error) {
            this.logger.error(`Failed to check token blacklist: ${error.message}`);
            return false;
        }
    }
    async getHealth() {
        try {
            await this.redis.ping();
            return { status: 'healthy' };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                message: error.message,
            };
        }
    }
    async cleanupExpiredTokens() {
        this.logger.debug('Starting cleanup of expired tokens');
        try {
            const refreshTokenCount = (await this.redis.eval("return #redis.call('keys', ARGV[1])", 0, `${this.REFRESH_TOKEN_PREFIX}*`));
            const blacklistCount = (await this.redis.eval("return #redis.call('keys', ARGV[1])", 0, `${this.BLACKLIST_PREFIX}*`));
            this.logger.debug(`Token cleanup completed. Active refresh tokens: ${refreshTokenCount}, Blacklisted tokens: ${blacklistCount}`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Token cleanup failed: ${errorMessage}`);
        }
    }
    async onApplicationShutdown() {
        await this.redis.quit();
        this.logger.log('Redis connection closed');
    }
};
exports.RedisTokenService = RedisTokenService;
exports.RedisTokenService = RedisTokenService = RedisTokenService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisTokenService);
//# sourceMappingURL=redis-token.service.js.map