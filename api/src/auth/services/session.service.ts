import { Injectable, Logger } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import { PrismaService } from '../../common/prisma/prisma.service'
import { SessionData } from '../interfaces/auth.interface'

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name)

  constructor(private readonly prisma: PrismaService) {}

  async createSession(
    userId: number,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SessionData> {
    const sessionId = uuidv4()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    const now = new Date()

    const session = await this.prisma.userSession.create({
      data: {
        sessionId,
        userId,
        deviceInfo,
        ipAddress,
        userAgent,
        refreshToken: '', // Will be updated later
        createdAt: now,
        lastActivity: now,
        expiresAt
      }
    })

    this.logger.log(`Created session ${sessionId} for user ${userId}`)

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
    }
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const session = await this.prisma.userSession.findUnique({
      where: { sessionId }
    })

    if (!session) {
      return null
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
    }
  }

  async updateSession(
    sessionId: string,
    updates: Partial<{
      refreshToken: string
      lastActivity: Date
      deviceInfo: string
      ipAddress: string
      userAgent: string
    }>
  ): Promise<void> {
    await this.prisma.userSession.update({
      where: { sessionId },
      data: updates
    })

    this.logger.log(`Updated session ${sessionId}`)
  }

  async getUserSessions(userId: number): Promise<SessionData[]> {
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
    })

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
    }))
  }

  async deleteSession(sessionId: string, userId?: number): Promise<void> {
    const where = userId
      ? { sessionId, userId }
      : { sessionId }

    await this.prisma.userSession.delete({
      where
    })

    this.logger.log(`Deleted session ${sessionId}`)
  }

  async deleteUserSessions(userId: number): Promise<number> {
    const result = await this.prisma.userSession.deleteMany({
      where: { userId }
    })

    this.logger.log(`Deleted ${result.count} sessions for user ${userId}`)
    return result.count
  }

  async deleteExpiredSessions(): Promise<number> {
    const result = await this.prisma.userSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })

    this.logger.log(`Deleted ${result.count} expired sessions`)
    return result.count
  }

  async getActiveSessionsCount(userId: number): Promise<number> {
    return this.prisma.userSession.count({
      where: {
        userId,
        expiresAt: {
          gt: new Date()
        }
      }
    })
  }

  async isSessionValid(sessionId: string): Promise<boolean> {
    const session = await this.prisma.userSession.findUnique({
      where: { sessionId }
    })

    return session !== null && session.expiresAt > new Date()
  }
}
