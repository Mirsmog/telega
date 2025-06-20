import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { AuthResponseDto, LogoutDto, RefreshTokenDto, TelegramAuthDto } from './dto';
import { RedisTokenService } from './services/redis-token.service';
import { TelegramAuthService } from './services/telegram-auth.service';
export declare class AuthService {
    private readonly jwtService;
    private readonly configService;
    private readonly redisTokenService;
    private readonly telegramAuthService;
    private readonly userService;
    private readonly logger;
    private readonly jwtExpiresIn;
    private readonly jwtRefreshExpiresIn;
    constructor(jwtService: JwtService, configService: ConfigService, redisTokenService: RedisTokenService, telegramAuthService: TelegramAuthService, userService: UserService);
    authenticateWithTelegram(telegramAuthDto: TelegramAuthDto): Promise<AuthResponseDto>;
    refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto>;
    logout(logoutDto: LogoutDto): Promise<{
        message: string;
    }>;
    validateToken(userId: string): Promise<{
        id: string;
        telegramId: string;
        username: string;
        firstName: string;
        lastName: string;
        role: import("@prisma/client").$Enums.RoleType;
        isActive: boolean;
        balance: string;
        frozenBalance: string;
        completedOrders: number;
        averageRating: string;
    }>;
    revokeAllUserTokens(userId: string): Promise<{
        message: string;
    }>;
    private generateTokens;
    private parseTimeToSeconds;
}
