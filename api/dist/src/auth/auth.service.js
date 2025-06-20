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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const crypto_1 = require("crypto");
const user_service_1 = require("../user/user.service");
const redis_token_service_1 = require("./services/redis-token.service");
const telegram_auth_service_1 = require("./services/telegram-auth.service");
const isJwtRefreshPayload = (token) => {
    return (token &&
        typeof token === 'object' &&
        token !== null &&
        'sub' in token &&
        'tokenId' in token &&
        typeof token.sub === 'string' &&
        typeof token.tokenId === 'string');
};
let AuthService = AuthService_1 = class AuthService {
    constructor(jwtService, configService, redisTokenService, telegramAuthService, userService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.redisTokenService = redisTokenService;
        this.telegramAuthService = telegramAuthService;
        this.userService = userService;
        this.logger = new common_1.Logger(AuthService_1.name);
        this.jwtExpiresIn = this.configService.get('JWT_EXPIRES_IN', '15m');
        this.jwtRefreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d');
    }
    async authenticateWithTelegram(telegramAuthDto) {
        try {
            this.telegramAuthService.validateTelegramAuth(telegramAuthDto);
            const userData = this.telegramAuthService.extractUserData(telegramAuthDto);
            const user = await this.userService.findOrCreateByTelegramData(userData);
            if (!user.isActive) {
                throw new common_1.UnauthorizedException('User account is inactive');
            }
            if (user.isBanned) {
                throw new common_1.UnauthorizedException('User account is banned');
            }
            const tokens = await this.generateTokens({
                id: user.id,
                telegramId: BigInt(user.telegramId),
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isActive: user.isActive,
                isBanned: user.isBanned,
            });
            this.logger.log(`User authenticated: ${user.id}`);
            return {
                ...tokens,
                user: {
                    id: user.id,
                    telegramId: user.telegramId,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    isActive: user.isActive,
                },
            };
        }
        catch (error) {
            this.logger.error('Telegram authentication failed:', error.message);
            throw error;
        }
    }
    async refreshToken(refreshTokenDto) {
        try {
            const { refreshToken } = refreshTokenDto;
            const decodedToken = this.jwtService.decode(refreshToken);
            if (!isJwtRefreshPayload(decodedToken)) {
                throw new common_1.UnauthorizedException('Invalid refresh token format');
            }
            const userId = await this.redisTokenService.validateRefreshToken(decodedToken.tokenId);
            if (!userId || userId !== decodedToken.sub) {
                throw new common_1.UnauthorizedException('Invalid or expired refresh token');
            }
            try {
                await this.jwtService.verifyAsync(refreshToken);
            }
            catch (error) {
                await this.redisTokenService.revokeRefreshToken(decodedToken.tokenId);
                throw new common_1.UnauthorizedException('Invalid refresh token signature');
            }
            const userForAuth = await this.userService.findForAuth(userId);
            if (!userForAuth) {
                await this.redisTokenService.revokeRefreshToken(decodedToken.tokenId);
                throw new common_1.UnauthorizedException('User not found');
            }
            if (!userForAuth.isActive || userForAuth.isBanned) {
                await this.redisTokenService.revokeRefreshToken(decodedToken.tokenId);
                throw new common_1.UnauthorizedException('User account is inactive or banned');
            }
            await this.redisTokenService.revokeRefreshToken(decodedToken.tokenId);
            const tokens = await this.generateTokens(userForAuth);
            await this.userService.updateLastSeen(userForAuth.id);
            this.logger.debug(`Token refreshed for user: ${userForAuth.id}`);
            return {
                ...tokens,
                user: {
                    id: userForAuth.id,
                    telegramId: userForAuth.telegramId.toString(),
                    username: userForAuth.username,
                    firstName: userForAuth.firstName,
                    lastName: userForAuth.lastName,
                    role: userForAuth.role,
                    isActive: userForAuth.isActive,
                },
            };
        }
        catch (error) {
            this.logger.error('Token refresh failed:', error.message);
            throw error;
        }
    }
    async logout(logoutDto) {
        try {
            const { refreshToken } = logoutDto;
            const decodedToken = this.jwtService.decode(refreshToken);
            if (isJwtRefreshPayload(decodedToken)) {
                await this.redisTokenService.revokeRefreshToken(decodedToken.tokenId);
                this.logger.debug(`User logged out, token revoked: ${decodedToken.tokenId}`);
            }
            return { message: 'Successfully logged out' };
        }
        catch (error) {
            this.logger.error('Logout failed:', error.message);
            return { message: 'Logged out' };
        }
    }
    async validateToken(userId) {
        const user = await this.userService.validateUserStatus(userId);
        return {
            id: user.id,
            telegramId: user.telegramId,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            balance: user.balance,
            frozenBalance: user.frozenBalance,
            completedOrders: user.completedOrders,
            averageRating: user.averageRating,
        };
    }
    async revokeAllUserTokens(userId) {
        try {
            await this.redisTokenService.revokeAllUserTokens(userId);
            this.logger.log(`All tokens revoked for user: ${userId}`);
            return { message: 'All tokens revoked successfully' };
        }
        catch (error) {
            this.logger.error('Failed to revoke all user tokens:', error.message);
            throw new common_1.BadRequestException('Failed to revoke tokens');
        }
    }
    async generateTokens(user) {
        const tokenId = (0, crypto_1.randomUUID)();
        const jwtPayload = {
            sub: user.id,
            telegramId: user.telegramId.toString(),
            username: user.username,
            role: user.role,
        };
        const refreshPayload = {
            sub: user.id,
            tokenId,
        };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(jwtPayload, {
                expiresIn: this.jwtExpiresIn,
            }),
            this.jwtService.signAsync(refreshPayload, {
                expiresIn: this.jwtRefreshExpiresIn,
            }),
        ]);
        const refreshExpiresInSeconds = this.parseTimeToSeconds(this.jwtRefreshExpiresIn);
        await this.redisTokenService.storeRefreshToken(tokenId, user.id, refreshExpiresInSeconds);
        return {
            accessToken,
            refreshToken,
            expiresIn: this.parseTimeToSeconds(this.jwtExpiresIn),
            tokenType: 'Bearer',
        };
    }
    parseTimeToSeconds(time) {
        const match = time.match(/^(\d+)([smhd])$/);
        if (!match) {
            return 900;
        }
        const value = parseInt(match[1]);
        const unit = match[2];
        switch (unit) {
            case 's':
                return value;
            case 'm':
                return value * 60;
            case 'h':
                return value * 60 * 60;
            case 'd':
                return value * 60 * 60 * 24;
            default:
                return 900;
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        redis_token_service_1.RedisTokenService,
        telegram_auth_service_1.TelegramAuthService,
        user_service_1.UserService])
], AuthService);
//# sourceMappingURL=auth.service.js.map