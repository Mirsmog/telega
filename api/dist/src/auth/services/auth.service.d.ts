import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UsersService } from '../../users/users.service';
import { LoginDto, TelegramWebAppLoginDto } from '../dto/login.dto';
import { JwtPayload, LoginResponse, TokenPair } from '../interfaces/auth.interface';
import { SessionService } from './session.service';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly usersService;
    private readonly sessionService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, usersService: UsersService, sessionService: SessionService);
    loginWithTelegram(loginDto: LoginDto): Promise<LoginResponse>;
    loginWithWebApp(webAppLoginDto: TelegramWebAppLoginDto): Promise<LoginResponse>;
    refreshTokens(refreshToken: string): Promise<TokenPair>;
    logout(sessionId: string): Promise<void>;
    logoutAll(userId: number): Promise<number>;
    validateUser(payload: JwtPayload): Promise<{
        id: number;
        telegramId: string;
        firstName: string;
        lastName: string;
        username: string;
        roles: string[];
        isActive: boolean;
        isBlocked: boolean;
        sessionId: string;
    }>;
    validateWebAppData(initData: string): Promise<boolean>;
    private validateTelegramAuth;
    private parseWebAppUserData;
    private generateTokens;
}
