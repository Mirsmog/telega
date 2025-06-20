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
const jwt_1 = require("@nestjs/jwt");
const crypto = require("crypto");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const users_service_1 = require("../../users/users.service");
const session_service_1 = require("./session.service");
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, jwtService, usersService, sessionService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.usersService = usersService;
        this.sessionService = sessionService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async loginWithTelegram(loginDto) {
        this.logger.log(`Telegram login attempt for user: ${loginDto.telegramId}`);
        if (!this.validateTelegramAuth(loginDto)) {
            throw new common_1.UnauthorizedException('Invalid Telegram authentication data');
        }
        let user = await this.usersService.findByTelegramId(parseInt(loginDto.telegramId));
        if (!user) {
            user = await this.usersService.createFromTelegram({
                userId: parseInt(loginDto.telegramId),
                firstName: loginDto.firstName,
                lastName: loginDto.lastName,
                username: loginDto.username
            });
            this.logger.log(`Created new user: ${user.id}`);
        }
        else {
            const needsUpdate = user.firstName !== loginDto.firstName ||
                user.lastName !== loginDto.lastName ||
                user.username !== loginDto.username;
            if (needsUpdate) {
                user = await this.usersService.updateFromTelegram(user.id, {
                    firstName: loginDto.firstName,
                    lastName: loginDto.lastName,
                    username: loginDto.username
                });
                this.logger.log(`Updated user info: ${user.id}`);
            }
        }
        if (user.isBlocked) {
            throw new common_1.UnauthorizedException('User account is blocked');
        }
        const session = await this.sessionService.createSession(user.id, loginDto.deviceInfo, loginDto.ipAddress, loginDto.userAgent);
        const userRoles = user.roles.map(r => r.role.toString());
        const tokens = await this.generateTokens(user.id, user.userId.toString(), userRoles, session.sessionId);
        await this.sessionService.updateSession(session.sessionId, {
            refreshToken: tokens.refreshToken
        });
        return {
            user: {
                id: user.id,
                telegramId: user.userId.toString(),
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                roles: userRoles,
                isActive: user.isActive,
                isBlocked: user.isBlocked
            },
            tokens,
            session: {
                sessionId: session.sessionId,
                expiresAt: session.expiresAt
            }
        };
    }
    async loginWithWebApp(webAppLoginDto) {
        this.logger.log('WebApp login attempt');
        if (!await this.validateWebAppData(webAppLoginDto.initData)) {
            throw new common_1.UnauthorizedException('Invalid WebApp data');
        }
        const userData = this.parseWebAppUserData(webAppLoginDto.initData);
        if (!userData) {
            throw new common_1.UnauthorizedException('No user data in WebApp init data');
        }
        const loginDto = {
            telegramId: userData.id.toString(),
            firstName: userData.first_name,
            lastName: userData.last_name,
            username: userData.username,
            hash: '',
            authDate: Math.floor(Date.now() / 1000),
            deviceInfo: webAppLoginDto.deviceInfo,
            ipAddress: webAppLoginDto.ipAddress,
            userAgent: webAppLoginDto.userAgent
        };
        return this.loginWithTelegram(loginDto);
    }
    async refreshTokens(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken);
            const session = await this.sessionService.getSession(payload.sessionId);
            if (!session || session.refreshToken !== refreshToken) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            if (session.expiresAt < new Date()) {
                await this.sessionService.deleteSession(session.sessionId);
                throw new common_1.UnauthorizedException('Session expired');
            }
            const user = await this.usersService.findById(payload.sub);
            if (!user || user.isBlocked) {
                throw new common_1.UnauthorizedException('User not found or blocked');
            }
            const userRoles = user.roles.map(r => r.role.toString());
            const tokens = await this.generateTokens(user.id, user.userId.toString(), userRoles, session.sessionId);
            await this.sessionService.updateSession(session.sessionId, {
                refreshToken: tokens.refreshToken,
                lastActivity: new Date()
            });
            this.logger.log(`Tokens refreshed for user: ${user.id}`);
            return tokens;
        }
        catch (error) {
            this.logger.error('Token refresh failed:', error);
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async logout(sessionId) {
        await this.sessionService.deleteSession(sessionId);
        this.logger.log(`User logged out, session: ${sessionId}`);
    }
    async logoutAll(userId) {
        const count = await this.sessionService.deleteUserSessions(userId);
        this.logger.log(`User ${userId} logged out from all sessions: ${count}`);
        return count;
    }
    async validateUser(payload) {
        const user = await this.usersService.findById(payload.sub);
        if (!user || user.isBlocked) {
            return null;
        }
        const session = await this.sessionService.getSession(payload.sessionId);
        if (!session || session.expiresAt < new Date()) {
            return null;
        }
        await this.sessionService.updateSession(payload.sessionId, {
            lastActivity: new Date()
        });
        const userRoles = user.roles.map(r => r.role.toString());
        return {
            id: user.id,
            telegramId: user.userId.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            roles: userRoles,
            isActive: user.isActive,
            isBlocked: user.isBlocked,
            sessionId: payload.sessionId
        };
    }
    async validateWebAppData(initData) {
        try {
            const botToken = process.env.TELEGRAM_BOT_TOKEN;
            if (!botToken) {
                this.logger.error('TELEGRAM_BOT_TOKEN not configured');
                return false;
            }
            const urlParams = new URLSearchParams(initData);
            const hash = urlParams.get('hash');
            if (!hash) {
                return false;
            }
            urlParams.delete('hash');
            const dataCheckString = Array.from(urlParams.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, value]) => `${key}=${value}`)
                .join('\n');
            const secretKey = crypto
                .createHmac('sha256', 'WebAppData')
                .update(botToken)
                .digest();
            const expectedHash = crypto
                .createHmac('sha256', secretKey)
                .update(dataCheckString)
                .digest('hex');
            return hash === expectedHash;
        }
        catch (error) {
            this.logger.error('WebApp data validation failed:', error);
            return false;
        }
    }
    validateTelegramAuth(loginDto) {
        try {
            const botToken = process.env.TELEGRAM_BOT_TOKEN;
            if (!botToken) {
                this.logger.error('TELEGRAM_BOT_TOKEN not configured');
                return false;
            }
            const dataCheckString = [
                `auth_date=${loginDto.authDate}`,
                `first_name=${loginDto.firstName}`,
                loginDto.lastName ? `last_name=${loginDto.lastName}` : null,
                `id=${loginDto.telegramId}`,
                loginDto.username ? `username=${loginDto.username}` : null
            ]
                .filter(Boolean)
                .sort()
                .join('\n');
            const secretKey = crypto
                .createHash('sha256')
                .update(botToken)
                .digest();
            const expectedHash = crypto
                .createHmac('sha256', secretKey)
                .update(dataCheckString)
                .digest('hex');
            const authAge = Date.now() / 1000 - loginDto.authDate;
            if (authAge > 86400) {
                this.logger.warn('Auth data is too old');
                return false;
            }
            return loginDto.hash === expectedHash;
        }
        catch (error) {
            this.logger.error('Telegram auth validation failed:', error);
            return false;
        }
    }
    parseWebAppUserData(initData) {
        try {
            const urlParams = new URLSearchParams(initData);
            const userStr = urlParams.get('user');
            if (!userStr) {
                return null;
            }
            return JSON.parse(userStr);
        }
        catch (error) {
            this.logger.error('Failed to parse WebApp user data:', error);
            return null;
        }
    }
    async generateTokens(userId, telegramId, roles, sessionId) {
        const payload = {
            sub: userId,
            telegramId,
            roles,
            sessionId
        };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, { expiresIn: '15m' }),
            this.jwtService.signAsync(payload, { expiresIn: '7d' })
        ]);
        return {
            accessToken,
            refreshToken,
            expiresIn: 15 * 60
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        users_service_1.UsersService,
        session_service_1.SessionService])
], AuthService);
//# sourceMappingURL=auth.service.js.map