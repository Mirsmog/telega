import { RoleType } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto';
export declare class UserService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(createUserDto: CreateUserDto): Promise<UserResponseDto>;
    findById(id: string): Promise<UserResponseDto | null>;
    findByTelegramId(telegramId: bigint): Promise<UserResponseDto | null>;
    findOrCreateByTelegramData(userData: {
        telegramId: bigint;
        username?: string;
        firstName: string;
        lastName?: string;
        photoUrl?: string;
    }): Promise<UserResponseDto>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto>;
    updateLastSeen(id: string): Promise<void>;
    validateUserStatus(id: string): Promise<UserResponseDto>;
    findForAuth(id: string): Promise<{
        id: string;
        telegramId: bigint;
        username: string | null;
        firstName: string;
        lastName: string | null;
        role: RoleType;
        isActive: boolean;
        isBanned: boolean;
    } | null>;
    banUser(id: string, reason?: string): Promise<UserResponseDto>;
    unbanUser(id: string): Promise<UserResponseDto>;
    deactivateUser(id: string): Promise<UserResponseDto>;
    activateUser(id: string): Promise<UserResponseDto>;
    deleteUser(id: string): Promise<{
        message: string;
    }>;
    getUserStats(id: string): Promise<{
        totalOrders: number;
        completedOrders: number;
        cancelledOrders: number;
        averageRating: string;
        totalReviews: number;
        balance: string;
        frozenBalance: string;
        totalEarned: string;
    }>;
    private formatUserResponse;
}
