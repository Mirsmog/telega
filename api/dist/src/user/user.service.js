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
var UserService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../database/prisma.service");
let UserService = UserService_1 = class UserService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(UserService_1.name);
    }
    async create(createUserDto) {
        try {
            const user = await this.prisma.user.create({
                data: {
                    telegramId: createUserDto.telegramId,
                    username: createUserDto.username,
                    firstName: createUserDto.firstName,
                    lastName: createUserDto.lastName,
                    phone: createUserDto.phone,
                    email: createUserDto.email,
                    role: createUserDto.role || client_1.RoleType.CUSTOMER,
                    lastSeenAt: new Date(),
                },
            });
            this.logger.log(`New user created: ${user.id} (Telegram: ${createUserDto.telegramId})`);
            return this.formatUserResponse(user);
        }
        catch (error) {
            this.logger.error('Failed to create user:', error.message);
            throw new common_1.BadRequestException('Failed to create user');
        }
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!user) {
            return null;
        }
        return this.formatUserResponse(user);
    }
    async findByTelegramId(telegramId) {
        const user = await this.prisma.user.findUnique({
            where: { telegramId },
        });
        if (!user) {
            return null;
        }
        return this.formatUserResponse(user);
    }
    async findOrCreateByTelegramData(userData) {
        let user = await this.prisma.user.findUnique({
            where: { telegramId: userData.telegramId },
        });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    telegramId: userData.telegramId,
                    username: userData.username,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    role: client_1.RoleType.CUSTOMER,
                    lastSeenAt: new Date(),
                },
            });
            this.logger.log(`New user created: ${user.id} (Telegram: ${userData.telegramId})`);
        }
        else {
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    username: userData.username,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    lastSeenAt: new Date(),
                },
            });
        }
        return this.formatUserResponse(user);
    }
    async update(id, updateUserDto) {
        try {
            const user = await this.prisma.user.update({
                where: { id },
                data: {
                    ...updateUserDto,
                    updatedAt: new Date(),
                },
            });
            this.logger.log(`User updated: ${user.id}`);
            return this.formatUserResponse(user);
        }
        catch (error) {
            this.logger.error('Failed to update user:', error.message);
            throw new common_1.BadRequestException('Failed to update user');
        }
    }
    async updateLastSeen(id) {
        try {
            await this.prisma.user.update({
                where: { id },
                data: { lastSeenAt: new Date() },
            });
        }
        catch (error) {
            this.logger.error('Failed to update last seen:', error.message);
        }
    }
    async validateUserStatus(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                telegramId: true,
                username: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                isBanned: true,
                balance: true,
                frozenBalance: true,
                completedOrders: true,
                averageRating: true,
                banReason: true,
                phone: true,
                email: true,
                totalEarned: true,
                orderLimit: true,
                createLimit: true,
                cancelledOrders: true,
                totalReviews: true,
                hasActivePlan: true,
                planExpiresAt: true,
                referralCode: true,
                notificationsEnabled: true,
                emailNotifications: true,
                lastSeenAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (!user.isActive) {
            throw new common_1.BadRequestException('User account is inactive');
        }
        if (user.isBanned) {
            throw new common_1.BadRequestException('User account is banned');
        }
        return this.formatUserResponse(user);
    }
    async findForAuth(id) {
        return this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                telegramId: true,
                username: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                isBanned: true,
            },
        });
    }
    async banUser(id, reason) {
        const user = await this.prisma.user.update({
            where: { id },
            data: {
                isBanned: true,
                banReason: reason,
                updatedAt: new Date(),
            },
        });
        this.logger.log(`User banned: ${user.id} - Reason: ${reason || 'No reason provided'}`);
        return this.formatUserResponse(user);
    }
    async unbanUser(id) {
        const user = await this.prisma.user.update({
            where: { id },
            data: {
                isBanned: false,
                banReason: null,
                updatedAt: new Date(),
            },
        });
        this.logger.log(`User unbanned: ${user.id}`);
        return this.formatUserResponse(user);
    }
    async deactivateUser(id) {
        const user = await this.prisma.user.update({
            where: { id },
            data: {
                isActive: false,
                updatedAt: new Date(),
            },
        });
        this.logger.log(`User account deactivated: ${user.id}`);
        return this.formatUserResponse(user);
    }
    async activateUser(id) {
        const user = await this.prisma.user.update({
            where: { id },
            data: {
                isActive: true,
                updatedAt: new Date(),
            },
        });
        this.logger.log(`User account activated: ${user.id}`);
        return this.formatUserResponse(user);
    }
    async deleteUser(id) {
        await this.deactivateUser(id);
        return { message: 'User account deactivated successfully' };
    }
    async getUserStats(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                completedOrders: true,
                cancelledOrders: true,
                averageRating: true,
                totalReviews: true,
                balance: true,
                frozenBalance: true,
                totalEarned: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return {
            totalOrders: user.completedOrders + user.cancelledOrders,
            completedOrders: user.completedOrders,
            cancelledOrders: user.cancelledOrders,
            averageRating: user.averageRating.toString(),
            totalReviews: user.totalReviews,
            balance: user.balance.toString(),
            frozenBalance: user.frozenBalance.toString(),
            totalEarned: user.totalEarned.toString(),
        };
    }
    formatUserResponse(user) {
        return {
            id: user.id,
            telegramId: user.telegramId.toString(),
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            isBanned: user.isBanned,
            banReason: user.banReason,
            balance: user.balance.toString(),
            frozenBalance: user.frozenBalance.toString(),
            totalEarned: user.totalEarned.toString(),
            orderLimit: user.orderLimit,
            createLimit: user.createLimit,
            completedOrders: user.completedOrders,
            cancelledOrders: user.cancelledOrders,
            averageRating: user.averageRating.toString(),
            totalReviews: user.totalReviews,
            hasActivePlan: user.hasActivePlan,
            planExpiresAt: user.planExpiresAt,
            referralCode: user.referralCode,
            notificationsEnabled: user.notificationsEnabled,
            emailNotifications: user.emailNotifications,
            lastSeenAt: user.lastSeenAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
};
exports.UserService = UserService;
exports.UserService = UserService = UserService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserService);
//# sourceMappingURL=user.service.js.map