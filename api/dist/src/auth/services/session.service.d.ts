import { PrismaService } from '../../common/prisma/prisma.service';
import { SessionData } from '../interfaces/auth.interface';
export declare class SessionService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createSession(userId: number, deviceInfo?: string, ipAddress?: string, userAgent?: string): Promise<SessionData>;
    getSession(sessionId: string): Promise<SessionData | null>;
    updateSession(sessionId: string, updates: Partial<{
        refreshToken: string;
        lastActivity: Date;
        deviceInfo: string;
        ipAddress: string;
        userAgent: string;
    }>): Promise<void>;
    getUserSessions(userId: number): Promise<SessionData[]>;
    deleteSession(sessionId: string, userId?: number): Promise<void>;
    deleteUserSessions(userId: number): Promise<number>;
    deleteExpiredSessions(): Promise<number>;
    getActiveSessionsCount(userId: number): Promise<number>;
    isSessionValid(sessionId: string): Promise<boolean>;
}
