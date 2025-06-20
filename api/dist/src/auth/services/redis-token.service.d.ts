import { ConfigService } from '@nestjs/config';
export declare class RedisTokenService {
    private readonly configService;
    private readonly logger;
    private readonly redis;
    private readonly REFRESH_TOKEN_PREFIX;
    private readonly BLACKLIST_PREFIX;
    constructor(configService: ConfigService);
    storeRefreshToken(tokenId: string, userId: string, expiresIn: number): Promise<void>;
    validateRefreshToken(tokenId: string): Promise<string | null>;
    revokeRefreshToken(tokenId: string): Promise<void>;
    revokeAllUserTokens(userId: string): Promise<void>;
    blacklistToken(jti: string, expiresIn: number): Promise<void>;
    isTokenBlacklisted(jti: string): Promise<boolean>;
    getHealth(): Promise<{
        status: string;
        message?: string;
    }>;
    cleanupExpiredTokens(): Promise<void>;
    onApplicationShutdown(): Promise<void>;
}
