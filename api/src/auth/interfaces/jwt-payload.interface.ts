import { RoleType } from '@prisma/client';

export interface JwtPayload {
  sub: string; // User ID
  telegramId: string;
  username?: string;
  role: RoleType;
  iat?: number;
  exp?: number;
}

export interface JwtRefreshPayload {
  sub: string; // User ID
  tokenId: string; // Unique token identifier
  iat?: number;
  exp?: number;
}
