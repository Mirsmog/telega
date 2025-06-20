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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const common_types_1 = require("../types/common.types");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                roles: true,
                userRegions: {
                    include: { region: true }
                },
                vehicles: {
                    include: { category: true }
                }
            },
        });
        return user;
    }
    async findByTelegramId(userId) {
        const user = await this.prisma.user.findUnique({
            where: { userId: BigInt(userId) },
            include: {
                roles: true,
                userRegions: {
                    include: { region: true }
                },
                vehicles: {
                    include: { category: true }
                }
            },
        });
        return user;
    }
    async createFromTelegram(data) {
        const existingUser = await this.findByTelegramId(data.userId);
        if (existingUser) {
            throw new common_1.ConflictException('User already exists');
        }
        const refCode = this.generateRefCode();
        const user = await this.prisma.user.create({
            data: {
                userId: BigInt(data.userId),
                firstName: data.firstName,
                lastName: data.lastName,
                username: data.username,
                refCode,
                roles: {
                    create: [
                        { role: common_types_1.RoleType.CUSTOMER }
                    ]
                }
            },
            include: {
                roles: true,
                userRegions: {
                    include: { region: true }
                },
                vehicles: {
                    include: { category: true }
                }
            },
        });
        return user;
    }
    async updateFromTelegram(id, data) {
        const user = await this.prisma.user.update({
            where: { id },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                username: data.username,
                updatedAt: new Date(),
            },
            include: {
                roles: true,
                userRegions: {
                    include: { region: true }
                },
                vehicles: {
                    include: { category: true }
                }
            },
        });
        return user;
    }
    async updateLastSeen(id) {
        await this.prisma.user.update({
            where: { id },
            data: { lastSeen: new Date() },
        });
    }
    async create(createUserDto) {
        const existingUser = await this.findByTelegramId(createUserDto.userId);
        if (existingUser) {
            throw new common_1.ConflictException('User already exists');
        }
        const refCode = this.generateRefCode();
        const user = await this.prisma.user.create({
            data: {
                userId: BigInt(createUserDto.userId),
                firstName: createUserDto.firstName,
                lastName: createUserDto.lastName,
                username: createUserDto.username,
                phone: createUserDto.phone,
                refCode,
                parentRefCode: createUserDto.parentRefCode,
                roles: {
                    create: createUserDto.roles?.map(role => ({ role })) || [
                        { role: common_types_1.RoleType.CUSTOMER }
                    ]
                }
            },
            include: {
                roles: true,
                userRegions: {
                    include: { region: true }
                },
                vehicles: {
                    include: { category: true }
                }
            },
        });
        return this.mapToResponseDto(user);
    }
    async update(id, updateUserDto) {
        const user = await this.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: {
                firstName: updateUserDto.firstName,
                lastName: updateUserDto.lastName,
                username: updateUserDto.username,
                phone: updateUserDto.phone,
                updatedAt: new Date(),
            },
            include: {
                roles: true,
                userRegions: {
                    include: { region: true }
                },
                vehicles: {
                    include: { category: true }
                }
            },
        });
        return this.mapToResponseDto(updatedUser);
    }
    async updateRoles(id, roles) {
        const user = await this.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.prisma.userRole.deleteMany({
            where: { userId: id }
        });
        await this.prisma.userRole.createMany({
            data: roles.map(role => ({ userId: id, role }))
        });
        const updatedUser = await this.findById(id);
        return this.mapToResponseDto(updatedUser);
    }
    async updateBalance(id, type, amount) {
        const updateData = {};
        switch (type) {
            case 'customer':
                updateData.customerBalance = amount;
                break;
            case 'performer':
                updateData.performerBalance = amount;
                break;
            case 'referral':
                updateData.refBalance = amount;
                break;
        }
        await this.prisma.user.update({
            where: { id },
            data: updateData,
        });
    }
    async addBalance(id, type, amount) {
        const user = await this.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const updateData = {};
        switch (type) {
            case 'customer':
                updateData.customerBalance = user.customerBalance.toNumber() + amount;
                break;
            case 'performer':
                updateData.performerBalance = user.performerBalance.toNumber() + amount;
                break;
            case 'referral':
                updateData.refBalance = user.refBalance.toNumber() + amount;
                break;
        }
        await this.prisma.user.update({
            where: { id },
            data: updateData,
        });
    }
    async blockUser(id, reason) {
        await this.prisma.user.update({
            where: { id },
            data: {
                isBlocked: true,
                blockedAt: new Date(),
                isActive: false,
            },
        });
    }
    async unblockUser(id) {
        await this.prisma.user.update({
            where: { id },
            data: {
                isBlocked: false,
                blockedAt: null,
                isActive: true,
            },
        });
    }
    async getUserStats(id) {
        const user = await this.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return {
            totalOrders: user.totalOrders,
            completedOrders: user.completedOrders,
            cancelledOrders: user.cancelledOrders,
            rating: user.rating,
            customerBalance: user.customerBalance.toNumber(),
            performerBalance: user.performerBalance.toNumber(),
            refBalance: user.refBalance.toNumber(),
        };
    }
    async findByRefCode(refCode) {
        return this.prisma.user.findUnique({
            where: { refCode },
        });
    }
    async getUsersByRole(role) {
        const users = await this.prisma.user.findMany({
            where: {
                roles: {
                    some: { role }
                }
            },
            include: {
                roles: true,
                userRegions: {
                    include: { region: true }
                },
                vehicles: {
                    include: { category: true }
                }
            },
        });
        return users.map(user => this.mapToResponseDto(user));
    }
    generateRefCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    mapToResponseDto(user) {
        return {
            id: user.id,
            userId: Number(user.userId),
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            roles: user.roles.map(role => role.role),
            customerBalance: user.customerBalance.toNumber(),
            performerBalance: user.performerBalance.toNumber(),
            refBalance: user.refBalance.toNumber(),
            refCode: user.refCode,
            parentRefCode: user.parentRefCode,
            rating: user.rating,
            totalOrders: user.totalOrders,
            completedOrders: user.completedOrders,
            cancelledOrders: user.cancelledOrders,
            isActive: user.isActive,
            isBlocked: user.isBlocked,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastSeen: user.lastSeen,
            regions: user.userRegions?.map(ur => ({
                code: ur.region.code,
                name: ur.region.name,
                isActive: ur.isActive,
            })) || [],
            vehicles: user.vehicles?.map(vehicle => ({
                id: vehicle.id,
                categoryCode: vehicle.categoryCode,
                categoryName: vehicle.category.name,
                type: vehicle.type,
                subtype: vehicle.subtype,
                brand: vehicle.brand,
                model: vehicle.model,
                licensePlate: vehicle.licensePlate,
                isActive: vehicle.isActive,
            })) || [],
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map