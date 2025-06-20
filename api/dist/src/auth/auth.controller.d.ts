import { Response, Request } from 'express';
import { AuthService } from './services/auth.service';
import { SessionService } from './services/session.service';
import { LoginDto, TelegramWebAppLoginDto, RefreshTokenDto } from './dto/login.dto';
import { AuthenticatedUser, LoginResponse, TokenPair, TelegramUser } from './interfaces/auth.interface';
export declare class AuthController {
    private readonly authService;
    private readonly sessionService;
    constructor(authService: AuthService, sessionService: SessionService);
    telegramLogin(loginDto: LoginDto, res: Response): Promise<LoginResponse>;
    webAppLogin(webAppLoginDto: TelegramWebAppLoginDto, res: Response): Promise<LoginResponse>;
    refresh(refreshDto: RefreshTokenDto, req: Request, res: Response): Promise<TokenPair>;
    logout(user: AuthenticatedUser, res: Response): Promise<{
        message: string;
    }>;
    logoutAll(user: AuthenticatedUser, res: Response): Promise<{
        message: string;
        sessionsTerminated: number;
    }>;
    getMe(user: AuthenticatedUser): Promise<{
        id: number;
        telegramId: string;
        firstName: string;
        lastName?: string;
        username?: string;
        roles: string[];
        isActive: boolean;
        isBlocked: boolean;
        session: {
            sessionId: string;
            expiresAt: Date;
            lastActivity: Date;
        };
    }>;
    getSessions(user: AuthenticatedUser): Promise<{
        sessions: Array<{
            sessionId: string;
            deviceInfo?: string;
            ipAddress?: string;
            userAgent?: string;
            createdAt: Date;
            lastActivity: Date;
            expiresAt: Date;
            isCurrent: boolean;
        }>;
        total: number;
    }>;
    terminateSession(user: AuthenticatedUser, sessionId: string): Promise<{
        message: string;
    }>;
    validateWebApp(initData: string): Promise<{
        valid: boolean;
        user?: TelegramUser;
    }>;
    verifyToken(user: AuthenticatedUser): Promise<{
        valid: boolean;
        user: {
            id: number;
            telegramId: string;
            roles: string[];
        };
        expiresIn: number;
    }>;
}
