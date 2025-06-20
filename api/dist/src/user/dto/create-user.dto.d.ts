import { RoleType } from '@prisma/client';
export declare class CreateUserDto {
    telegramId: bigint;
    username?: string;
    firstName: string;
    lastName?: string;
    phone?: string;
    email?: string;
    role?: RoleType;
    photoUrl?: string;
}
