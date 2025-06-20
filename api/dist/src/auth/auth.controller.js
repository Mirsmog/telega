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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./services/auth.service");
const session_service_1 = require("./services/session.service");
const login_dto_1 = require("./dto/login.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const current_user_decorator_1 = require("./decorators/current-user.decorator");
const public_decorator_1 = require("./decorators/public.decorator");
let AuthController = class AuthController {
    constructor(authService, sessionService) {
        this.authService = authService;
        this.sessionService = sessionService;
    }
    async telegramLogin(loginDto, res) {
        const result = await this.authService.loginWithTelegram(loginDto);
        res.cookie('refreshToken', result.tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/api/v1/auth'
        });
        return result;
    }
    async webAppLogin(webAppLoginDto, res) {
        const result = await this.authService.loginWithWebApp(webAppLoginDto);
        res.cookie('refreshToken', result.tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/api/v1/auth'
        });
        return result;
    }
    async refresh(refreshDto, req, res) {
        const refreshToken = refreshDto.refreshToken || req.cookies?.refreshToken;
        if (!refreshToken) {
            throw new Error('Refresh token not provided');
        }
        const tokens = await this.authService.refreshTokens(refreshToken);
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/api/v1/auth'
        });
        return tokens;
    }
    async logout(user, res) {
        await this.authService.logout(user.sessionId);
        res.clearCookie('refreshToken', {
            path: '/api/v1/auth'
        });
        return { message: 'Logout successful' };
    }
    async logoutAll(user, res) {
        const count = await this.authService.logoutAll(user.id);
        res.clearCookie('refreshToken', {
            path: '/api/v1/auth'
        });
        return {
            message: 'Logout from all sessions successful',
            sessionsTerminated: count
        };
    }
    async getMe(user) {
        const session = await this.sessionService.getSession(user.sessionId);
        return {
            id: user.id,
            telegramId: user.telegramId,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            roles: user.roles,
            isActive: user.isActive,
            isBlocked: user.isBlocked,
            session: {
                sessionId: session.sessionId,
                expiresAt: session.expiresAt,
                lastActivity: session.lastActivity
            }
        };
    }
    async getSessions(user) {
        const sessions = await this.sessionService.getUserSessions(user.id);
        const sessionList = sessions.map(session => ({
            sessionId: session.sessionId,
            deviceInfo: session.deviceInfo,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity,
            expiresAt: session.expiresAt,
            isCurrent: session.sessionId === user.sessionId
        }));
        return {
            sessions: sessionList,
            total: sessionList.length
        };
    }
    async terminateSession(user, sessionId) {
        await this.sessionService.deleteSession(sessionId, user.id);
        return { message: 'Session terminated successfully' };
    }
    async validateWebApp(initData) {
        try {
            const isValid = await this.authService.validateWebAppData(initData);
            if (isValid) {
                const urlParams = new URLSearchParams(initData);
                const userStr = urlParams.get('user');
                const user = userStr ? JSON.parse(userStr) : null;
                return {
                    valid: true,
                    user
                };
            }
            return { valid: false };
        }
        catch (error) {
            return { valid: false };
        }
    }
    async verifyToken(user) {
        const session = await this.sessionService.getSession(user.sessionId);
        const expiresIn = session ? Math.floor((session.expiresAt.getTime() - Date.now()) / 1000) : 0;
        return {
            valid: true,
            user: {
                id: user.id,
                telegramId: user.telegramId,
                roles: user.roles
            },
            expiresIn
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('telegram/login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Login via Telegram Bot' }),
    (0, swagger_1.ApiBody)({ type: login_dto_1.LoginDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Login successful',
        schema: {
            type: 'object',
            properties: {
                user: {
                    type: 'object',
                    properties: {
                        id: { type: 'number' },
                        telegramId: { type: 'string' },
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        username: { type: 'string' },
                        roles: { type: 'array', items: { type: 'string' } },
                        isActive: { type: 'boolean' },
                        isBlocked: { type: 'boolean' }
                    }
                },
                tokens: {
                    type: 'object',
                    properties: {
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' },
                        expiresIn: { type: 'number' }
                    }
                },
                session: {
                    type: 'object',
                    properties: {
                        sessionId: { type: 'string' },
                        expiresAt: { type: 'string', format: 'date-time' }
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid login data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Authentication failed' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "telegramLogin", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('webapp/login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Login via Telegram WebApp' }),
    (0, swagger_1.ApiBody)({ type: login_dto_1.TelegramWebAppLoginDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'WebApp login successful',
        schema: {
            type: 'object',
            properties: {
                user: {
                    type: 'object',
                    properties: {
                        id: { type: 'number' },
                        telegramId: { type: 'string' },
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        username: { type: 'string' },
                        roles: { type: 'array', items: { type: 'string' } },
                        isActive: { type: 'boolean' },
                        isBlocked: { type: 'boolean' }
                    }
                },
                tokens: {
                    type: 'object',
                    properties: {
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' },
                        expiresIn: { type: 'number' }
                    }
                },
                session: {
                    type: 'object',
                    properties: {
                        sessionId: { type: 'string' },
                        expiresAt: { type: 'string', format: 'date-time' }
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid WebApp data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'WebApp authentication failed' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.TelegramWebAppLoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "webAppLogin", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh access token' }),
    (0, swagger_1.ApiBody)({
        type: login_dto_1.RefreshTokenDto,
        description: 'Refresh token can be provided in body or will be read from httpOnly cookie'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Token refreshed successfully',
        schema: {
            type: 'object',
            properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                expiresIn: { type: 'number' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid refresh token' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.RefreshTokenDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Logout current session' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Logout successful' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('logout-all'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Logout from all sessions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Logout from all sessions successful' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logoutAll", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user info' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Current user information',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'number' },
                telegramId: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                username: { type: 'string' },
                roles: { type: 'array', items: { type: 'string' } },
                isActive: { type: 'boolean' },
                isBlocked: { type: 'boolean' },
                session: {
                    type: 'object',
                    properties: {
                        sessionId: { type: 'string' },
                        expiresAt: { type: 'string', format: 'date-time' },
                        lastActivity: { type: 'string', format: 'date-time' }
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getMe", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('sessions'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all user sessions' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User sessions list',
        schema: {
            type: 'object',
            properties: {
                sessions: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            sessionId: { type: 'string' },
                            deviceInfo: { type: 'string' },
                            ipAddress: { type: 'string' },
                            userAgent: { type: 'string' },
                            createdAt: { type: 'string', format: 'date-time' },
                            lastActivity: { type: 'string', format: 'date-time' },
                            expiresAt: { type: 'string', format: 'date-time' },
                            isCurrent: { type: 'boolean' }
                        }
                    }
                },
                total: { type: 'number' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getSessions", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)('sessions/:sessionId'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Terminate specific session' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Session terminated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "terminateSession", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('validate-webapp'),
    (0, swagger_1.ApiOperation)({ summary: 'Validate Telegram WebApp init data' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'WebApp data is valid' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid WebApp data' }),
    __param(0, (0, common_1.Body)('initData')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "validateWebApp", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('verify-token'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify current access token' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Token is valid',
        schema: {
            type: 'object',
            properties: {
                valid: { type: 'boolean' },
                user: {
                    type: 'object',
                    properties: {
                        id: { type: 'number' },
                        telegramId: { type: 'string' },
                        roles: { type: 'array', items: { type: 'string' } }
                    }
                },
                expiresIn: { type: 'number', description: 'Seconds until token expires' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid token' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyToken", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        session_service_1.SessionService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map