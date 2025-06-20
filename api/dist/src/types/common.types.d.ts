import { Region, RoleType, User, UserRegion, Vehicle, VehicleCategory } from '@prisma/client';
export { RoleType } from '@prisma/client';
export interface UserWithRelations extends User {
    roles: Array<{
        role: RoleType;
    }>;
    userRegions: Array<UserRegion & {
        region: Region;
    }>;
    vehicles: Array<Vehicle & {
        category: VehicleCategory;
    }>;
}
export interface UserWithRoles extends User {
    roles: Array<{
        role: RoleType;
    }>;
}
export interface TelegramAuthData {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    auth_date: number;
    hash: string;
}
export interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
}
export interface SessionContext {
    currentState?: string;
    data?: Record<string, unknown>;
    step?: number;
}
export interface AuthenticatedUser {
    sub: number;
    sessionId: string;
    userId: number;
    username?: string;
    firstName: string;
    lastName?: string;
    roles: RoleType[];
    iat?: number;
    exp?: number;
}
export interface AuthenticatedRequest extends Request {
    user: AuthenticatedUser;
}
export type NestApplication = {
    close(): Promise<void>;
};
