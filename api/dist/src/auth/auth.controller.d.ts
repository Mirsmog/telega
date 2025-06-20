import { AuthService } from './auth.service';
import { AuthResponseDto, LogoutDto, RefreshTokenDto, TelegramAuthDto } from './dto';
export declare class AuthController {
    private readonly authService;
    private readonly logger;
    constructor(authService: AuthService);
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
    revokeAllTokens(userId: string): Promise<{
        message: string;
    }>;
}
