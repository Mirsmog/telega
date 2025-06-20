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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const users_service_1 = require("./users.service");
const user_dto_1 = require("./dto/user.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async create(createUserDto) {
        return await this.usersService.create(createUserDto);
    }
    async getProfile(user) {
        const fullUser = await this.usersService.findById(user.id);
        if (!fullUser) {
            throw new Error('User not found');
        }
        return this.usersService.mapToResponseDto(fullUser);
    }
    async updateProfile(user, updateUserDto) {
        return await this.usersService.update(user.id, updateUserDto);
    }
    async getMyStats(user) {
        return this.usersService.getUserStats(user.id);
    }
    async addBalance(user, balanceDto) {
        await this.usersService.addBalance(user.id, balanceDto.type, balanceDto.amount);
        const stats = await this.usersService.getUserStats(user.id);
        let newBalance;
        switch (balanceDto.type) {
            case 'customer':
                newBalance = stats.customerBalance;
                break;
            case 'performer':
                newBalance = stats.performerBalance;
                break;
            case 'referral':
                newBalance = stats.refBalance;
                break;
        }
        return {
            message: `${balanceDto.type} balance updated successfully`,
            newBalance
        };
    }
    async addPerformerRole(user) {
        const currentRoles = user.roles;
        if (!currentRoles.includes('PERFORMER')) {
            const newRoles = [...currentRoles, 'PERFORMER'];
            return await this.usersService.updateRoles(user.id, newRoles);
        }
        const fullUser = await this.usersService.findById(user.id);
        return this.usersService.mapToResponseDto(fullUser);
    }
    async findAll(role, page = 1, limit = 10) {
        if (role) {
            const users = await this.usersService.getUsersByRole(role);
            return {
                users: users,
                total: users.length,
                page: 1,
                limit: users.length,
                totalPages: 1
            };
        }
        const users = await this.usersService.getUsersByRole(user_dto_1.RoleType.CUSTOMER);
        const performers = await this.usersService.getUsersByRole(user_dto_1.RoleType.PERFORMER);
        const allUsers = [...users, ...performers];
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedUsers = allUsers.slice(startIndex, endIndex);
        return {
            users: paginatedUsers,
            total: allUsers.length,
            page,
            limit,
            totalPages: Math.ceil(allUsers.length / limit)
        };
    }
    async findOne(id) {
        const user = await this.usersService.findById(id);
        if (!user) {
            throw new Error('User not found');
        }
        return this.usersService.mapToResponseDto(user);
    }
    async update(id, updateUserDto) {
        return await this.usersService.update(id, updateUserDto);
    }
    async updateRoles(id, updateRolesDto) {
        return await this.usersService.updateRoles(id, updateRolesDto.roles);
    }
    async blockUser(id, body) {
        await this.usersService.blockUser(id, body.reason);
        return { message: 'User blocked successfully' };
    }
    async unblockUser(id) {
        await this.usersService.unblockUser(id);
        return { message: 'User unblocked successfully' };
    }
    async getUserStats(id) {
        return this.usersService.getUserStats(id);
    }
    async updateUserBalance(id, balanceDto) {
        await this.usersService.addBalance(id, balanceDto.type, balanceDto.amount);
        const stats = await this.usersService.getUserStats(id);
        let newBalance;
        switch (balanceDto.type) {
            case 'customer':
                newBalance = stats.customerBalance;
                break;
            case 'performer':
                newBalance = stats.performerBalance;
                break;
            case 'referral':
                newBalance = stats.refBalance;
                break;
        }
        return {
            message: `User ${balanceDto.type} balance updated successfully`,
            newBalance
        };
    }
    async findByRefCode(refCode) {
        const user = await this.usersService.findByRefCode(refCode);
        if (!user) {
            throw new Error('User not found');
        }
        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            refCode: user.refCode
        };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Create new user (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'User created successfully', type: user_dto_1.UserResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'User already exists' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Admin role required' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Current user profile', type: user_dto_1.UserResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Put)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Update current user profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile updated successfully', type: user_dto_1.UserResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)('me/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User statistics', type: user_dto_1.UserStatsDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMyStats", null);
__decorate([
    (0, common_1.Post)('me/balance'),
    (0, swagger_1.ApiOperation)({ summary: 'Add balance to current user account' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Balance updated successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, user_dto_1.BalanceUpdateDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "addBalance", null);
__decorate([
    (0, common_1.Post)('me/roles'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('CUSTOMER', 'PERFORMER'),
    (0, swagger_1.ApiOperation)({ summary: 'Add performer role to current user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Role added successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "addPerformerRole", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all users (Admin only)' }),
    (0, swagger_1.ApiQuery)({ name: 'role', required: false, enum: user_dto_1.RoleType, description: 'Filter by role' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: 'Page number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Items per page' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of users', type: [user_dto_1.UserResponseDto] }),
    __param(0, (0, common_1.Query)('role')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user by ID (Admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number, description: 'User ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User found', type: user_dto_1.UserResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user by ID (Admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number, description: 'User ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User updated successfully', type: user_dto_1.UserResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Put)(':id/roles'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user roles (Admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number, description: 'User ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User roles updated successfully', type: user_dto_1.UserResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, user_dto_1.UpdateUserRolesDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateRoles", null);
__decorate([
    (0, common_1.Post)(':id/block'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Block user (Admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number, description: 'User ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User blocked successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "blockUser", null);
__decorate([
    (0, common_1.Post)(':id/unblock'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Unblock user (Admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number, description: 'User ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User unblocked successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "unblockUser", null);
__decorate([
    (0, common_1.Get)(':id/stats'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user statistics (Admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number, description: 'User ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User statistics', type: user_dto_1.UserStatsDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserStats", null);
__decorate([
    (0, common_1.Post)(':id/balance'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user balance (Admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number, description: 'User ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Balance updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, user_dto_1.BalanceUpdateDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateUserBalance", null);
__decorate([
    (0, common_1.Get)('referral/:refCode'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user by referral code' }),
    (0, swagger_1.ApiParam)({ name: 'refCode', type: String, description: 'Referral code' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User found by referral code' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('refCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findByRefCode", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('users'),
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map