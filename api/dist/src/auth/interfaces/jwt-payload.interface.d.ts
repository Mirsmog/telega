import { RoleType } from '@prisma/client';
export interface JwtPayload {
    sub: string;
    telegramId: string;
    username?: string;
    role: RoleType;
    iat?: number;
    exp?: number;
}
export interface JwtRefreshPayload {
    sub: string;
    tokenId: string;
    iat?: number;
    exp?: number;
}
