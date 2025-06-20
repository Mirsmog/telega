export * from './jwt-payload.interface';
import { RoleType } from '@prisma/client';
export interface UserData {
    id: string;
    telegramId: bigint;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    role: RoleType;
    isActive: boolean;
    isBanned: boolean;
}
