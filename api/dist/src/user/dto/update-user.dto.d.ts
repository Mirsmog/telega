import { RoleType } from '@prisma/client';
export declare class UpdateUserDto {
    username?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    role?: RoleType;
    isActive?: boolean;
    isBanned?: boolean;
    banReason?: string;
    orderLimit?: number;
    createLimit?: number;
    notificationsEnabled?: boolean;
    emailNotifications?: boolean;
}
