import { RoleType } from '@prisma/client';
export declare class UserResponseDto {
    id: string;
    telegramId: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    role: RoleType;
    isActive: boolean;
    balance?: string;
    frozenBalance?: string;
    completedOrders?: number;
    averageRating?: string;
}
export declare class AuthResponseDto {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
    user: UserResponseDto;
}
