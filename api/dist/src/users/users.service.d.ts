import { User } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { RoleType, UserWithRelations } from '../types/common.types';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findById(id: number): Promise<UserWithRelations | null>;
    findByTelegramId(userId: number): Promise<UserWithRelations | null>;
    createFromTelegram(data: {
        userId: number;
        firstName: string;
        lastName?: string;
        username?: string;
    }): Promise<UserWithRelations>;
    updateFromTelegram(id: number, data: {
        firstName?: string;
        lastName?: string;
        username?: string;
    }): Promise<UserWithRelations>;
    updateLastSeen(id: number): Promise<void>;
    create(createUserDto: CreateUserDto): Promise<UserResponseDto>;
    update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto>;
    updateRoles(id: number, roles: RoleType[]): Promise<UserResponseDto>;
    updateBalance(id: number, type: 'customer' | 'performer' | 'referral', amount: number): Promise<void>;
    addBalance(id: number, type: 'customer' | 'performer' | 'referral', amount: number): Promise<void>;
    blockUser(id: number, reason?: string): Promise<void>;
    unblockUser(id: number): Promise<void>;
    getUserStats(id: number): Promise<{
        totalOrders: number;
        completedOrders: number;
        cancelledOrders: number;
        rating: number;
        customerBalance: number;
        performerBalance: number;
        refBalance: number;
    }>;
    findByRefCode(refCode: string): Promise<User | null>;
    getUsersByRole(role: RoleType): Promise<UserResponseDto[]>;
    private generateRefCode;
    mapToResponseDto(user: UserWithRelations): UserResponseDto;
}
