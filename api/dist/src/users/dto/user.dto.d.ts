import { RoleType } from '../../types/common.types';
export { RoleType } from '../../types/common.types';
export declare class CreateUserDto {
    userId: number;
    firstName: string;
    lastName?: string;
    username?: string;
    phone?: string;
    parentRefCode?: string;
    roles?: RoleType[];
}
export declare class UpdateUserDto {
    firstName?: string;
    lastName?: string;
    username?: string;
    phone?: string;
}
export declare class UpdateUserRolesDto {
    roles: RoleType[];
}
export declare class UserResponseDto {
    id: number;
    userId: number;
    username?: string;
    firstName: string;
    lastName?: string;
    phone?: string;
    roles: RoleType[];
    customerBalance: number;
    performerBalance: number;
    refBalance: number;
    refCode: string;
    parentRefCode?: string;
    rating: number;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    isActive: boolean;
    isBlocked: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastSeen?: Date;
    regions: {
        code: string;
        name: string;
        isActive: boolean;
    }[];
    vehicles: {
        id: number;
        categoryCode: string;
        categoryName: string;
        type: string;
        subtype?: string;
        brand?: string;
        model?: string;
        licensePlate?: string;
        isActive: boolean;
    }[];
}
export declare class UserStatsDto {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    rating: number;
    customerBalance: number;
    performerBalance: number;
    refBalance: number;
}
export declare class BalanceUpdateDto {
    type: 'customer' | 'performer' | 'referral';
    amount: number;
}
