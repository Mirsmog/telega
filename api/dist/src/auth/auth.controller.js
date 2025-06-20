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
var AuthController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const user_decorator_1 = require("../common/decorators/user.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const auth_service_1 = require("./auth.service");
const dto_1 = require("./dto");
let AuthController = AuthController_1 = class AuthController {
    constructor(authService) {
        this.authService = authService;
        this.logger = new common_1.Logger(AuthController_1.name);
    }
    async authenticateWithTelegram(telegramAuthDto) {
        this.logger.log(`Telegram auth attempt for user: ${telegramAuthDto.id}`);
        return this.authService.authenticateWithTelegram(telegramAuthDto);
    }
    async refreshToken(refreshTokenDto) {
        this.logger.debug('Token refresh attempt');
        return this.authService.refreshToken(refreshTokenDto);
    }
    async logout(logoutDto) {
        this.logger.debug('User logout attempt');
        return this.authService.logout(logoutDto);
    }
    async validateToken(userId) {
        this.logger.debug(`Token validation for user: ${userId}`);
        return this.authService.validateToken(userId);
    }
    async revokeAllTokens(userId) {
        this.logger.log(`Revoking all tokens for user: ${userId}`);
        return this.authService.revokeAllUserTokens(userId);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('telegram'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Authenticate with Telegram',
        description: 'Authenticate user using Telegram Bot authentication data',
    }),
    (0, swagger_1.ApiBody)({ type: dto_1.TelegramAuthDto }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Authentication successful',
        type: dto_1.AuthResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: 'Invalid authentication data',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 401 },
                message: { type: 'string', example: 'Invalid authentication data' },
                error: { type: 'string', example: 'Unauthorized' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.TOO_MANY_REQUESTS,
        description: 'Rate limit exceeded',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 429 },
                message: { type: 'string', example: 'ThrottlerException: Too Many Requests' },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.TelegramAuthDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "authenticateWithTelegram", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Refresh access token',
        description: 'Get a new access token using a valid refresh token',
    }),
    (0, swagger_1.ApiBody)({ type: dto_1.RefreshTokenDto }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Token refresh successful',
        type: dto_1.AuthResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: 'Invalid or expired refresh token',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 401 },
                message: { type: 'string', example: 'Invalid or expired refresh token' },
                error: { type: 'string', example: 'Unauthorized' },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.RefreshTokenDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Logout user',
        description: 'Logout user and revoke refresh token',
    }),
    (0, swagger_1.ApiBody)({ type: dto_1.LogoutDto }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Logout successful',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Successfully logged out' },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.LogoutDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('validate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Validate current token',
        description: 'Validate current access token and return user information',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Token is valid',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: 'clxxx123' },
                telegramId: { type: 'string', example: '123456789' },
                username: { type: 'string', example: 'john_doe' },
                firstName: { type: 'string', example: 'John' },
                lastName: { type: 'string', example: 'Doe' },
                role: { type: 'string', enum: ['CUSTOMER', 'EXECUTOR', 'ADMIN'] },
                isActive: { type: 'boolean', example: true },
                balance: { type: 'string', example: '1000.00' },
                frozenBalance: { type: 'string', example: '0.00' },
                completedOrders: { type: 'number', example: 5 },
                averageRating: { type: 'string', example: '4.5' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: 'Invalid or expired access token',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 401 },
                message: { type: 'string', example: 'Unauthorized' },
            },
        },
    }),
    __param(0, (0, user_decorator_1.User)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "validateToken", null);
__decorate([
    (0, common_1.Post)('revoke-all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Revoke all user tokens',
        description: 'Revoke all refresh tokens for the current user (security feature)',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'All tokens revoked successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'All tokens revoked successfully' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: 'Invalid or expired access token',
    }),
    __param(0, (0, user_decorator_1.User)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "revokeAllTokens", null);
exports.AuthController = AuthController = AuthController_1 = __decorate([
    (0, swagger_1.ApiTags)('Authentication'),
    (0, common_1.Controller)('auth'),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map