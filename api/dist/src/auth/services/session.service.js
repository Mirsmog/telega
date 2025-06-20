"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SessionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let SessionService = SessionService_1 = class SessionService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(SessionService_1.name);
    }
    async createSession(userId, deviceInfo, ipAddress, userAgent) {
        const sessionId = (0, uuid_1.v4)();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const now = new Date();
        const session = await this.prisma.userSession.create({
            data: {
                sessionId,
                userId,
                deviceInfo,
                ipAddress,
                userAgent,
                refreshToken: '',
                createdAt: now,
                lastActivity: now,
                expiresAt
            }
        });
        this.logger.log(`Created session ${sessionId} for user ${userId}`);
        return {
            sessionId: session.sessionId,
            userId: session.userId,
            deviceInfo: session.deviceInfo,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            refreshToken: session.refreshToken,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity,
            expiresAt: session.expiresAt
        };
    }
    async getSession(sessionId) {
        const session = await this.prisma.userSession.findUnique({
            where: { sessionId }
        });
        if (!session) {
            return null;
        }
        return {
            sessionId: session.sessionId,
            userId: session.userId,
            deviceInfo: session.deviceInfo,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            refreshToken: session.refreshToken,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity,
            expiresAt: session.expiresAt
        };
    }
    async updateSession(sessionId, updates) {
        await this.prisma.userSession.update({
            where: { sessionId },
            data: updates
        });
        this.logger.log(`Updated session ${sessionId}`);
    }
    async getUserSessions(userId) {
        const sessions = await this.prisma.userSession.findMany({
            where: {
                userId,
                expiresAt: {
                    gt: new Date()
                }
            },
            orderBy: {
                lastActivity: 'desc'
            }
        });
        return sessions.map(session => ({
            sessionId: session.sessionId,
            userId: session.userId,
            deviceInfo: session.deviceInfo,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            refreshToken: session.refreshToken,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity,
            expiresAt: session.expiresAt
        }));
    }
    async deleteSession(sessionId, userId) {
        const where = userId
            ? { sessionId, userId }
            : { sessionId };
        await this.prisma.userSession.delete({
            where
        });
        this.logger.log(`Deleted session ${sessionId}`);
    }
    async deleteUserSessions(userId) {
        const result = await this.prisma.userSession.deleteMany({
            where: { userId }
        });
        this.logger.log(`Deleted ${result.count} sessions for user ${userId}`);
        return result.count;
    }
    async deleteExpiredSessions() {
        const result = await this.prisma.userSession.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date()
                }
            }
        });
        this.logger.log(`Deleted ${result.count} expired sessions`);
        return result.count;
    }
    async getActiveSessionsCount(userId) {
        return this.prisma.userSession.count({
            where: {
                userId,
                expiresAt: {
                    gt: new Date()
                }
            }
        });
    }
    async isSessionValid(sessionId) {
        const session = await this.prisma.userSession.findUnique({
            where: { sessionId }
        });
        return session !== null && session.expiresAt > new Date();
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = SessionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SessionService);
//# sourceMappingURL=session.service.js.map