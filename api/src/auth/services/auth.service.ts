import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as crypto from 'crypto'
import { PrismaService } from '../../common/prisma/prisma.service'
import { UsersService } from '../../users/users.service'
import { LoginDto, TelegramWebAppLoginDto } from '../dto/login.dto'
import { JwtPayload, LoginResponse, TokenPair } from '../interfaces/auth.interface'
import { SessionService } from './session.service'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly sessionService: SessionService
  ) {}

  async loginWithTelegram(loginDto: LoginDto): Promise<LoginResponse> {
    this.logger.log(`Telegram login attempt for user: ${loginDto.telegramId}`)

    // Validate Telegram authentication data
    if (!this.validateTelegramAuth(loginDto)) {
      throw new UnauthorizedException('Invalid Telegram authentication data')
    }

    // Find or create user
    let user = await this.usersService.findByTelegramId(parseInt(loginDto.telegramId))

    if (!user) {
      // Create new user with createFromTelegram method
      user = await this.usersService.createFromTelegram({
        userId: parseInt(loginDto.telegramId),
        firstName: loginDto.firstName,
        lastName: loginDto.lastName,
        username: loginDto.username
      })
      this.logger.log(`Created new user: ${user.id}`)
    } else {
      // Update user info if needed
      const needsUpdate =
        user.firstName !== loginDto.firstName ||
        user.lastName !== loginDto.lastName ||
        user.username !== loginDto.username

      if (needsUpdate) {
        user = await this.usersService.updateFromTelegram(user.id, {
          firstName: loginDto.firstName,
          lastName: loginDto.lastName,
          username: loginDto.username
        })
        this.logger.log(`Updated user info: ${user.id}`)
      }
    }

    // Check if user is blocked
    if (user.isBlocked) {
      throw new UnauthorizedException('User account is blocked')
    }

    // Create session
    const session = await this.sessionService.createSession(
      user.id,
      loginDto.deviceInfo,
      loginDto.ipAddress,
      loginDto.userAgent
    )

    // Extract roles as strings
    const userRoles = user.roles.map(r => r.role.toString())

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.userId.toString(), userRoles, session.sessionId)

    // Update session with refresh token
    await this.sessionService.updateSession(session.sessionId, {
      refreshToken: tokens.refreshToken
    })

    return {
      user: {
        id: user.id,
        telegramId: user.userId.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        roles: userRoles,
        isActive: user.isActive,
        isBlocked: user.isBlocked
      },
      tokens,
      session: {
        sessionId: session.sessionId,
        expiresAt: session.expiresAt
      }
    }
  }

  async loginWithWebApp(webAppLoginDto: TelegramWebAppLoginDto): Promise<LoginResponse> {
    this.logger.log('WebApp login attempt')

    // Validate WebApp data
    if (!await this.validateWebAppData(webAppLoginDto.initData)) {
      throw new UnauthorizedException('Invalid WebApp data')
    }

    // Parse user data from initData
    const userData = this.parseWebAppUserData(webAppLoginDto.initData)
    if (!userData) {
      throw new UnauthorizedException('No user data in WebApp init data')
    }

    // Convert to LoginDto format
    const loginDto: LoginDto = {
      telegramId: userData.id.toString(),
      firstName: userData.first_name,
      lastName: userData.last_name,
      username: userData.username,
      hash: '', // Not needed for WebApp
      authDate: Math.floor(Date.now() / 1000),
      deviceInfo: webAppLoginDto.deviceInfo,
      ipAddress: webAppLoginDto.ipAddress,
      userAgent: webAppLoginDto.userAgent
    }

    // Use same logic as Telegram login
    return this.loginWithTelegram(loginDto)
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken) as JwtPayload

      // Get session
      const session = await this.sessionService.getSession(payload.sessionId)
      if (!session || session.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token')
      }

      // Check if session is expired
      if (session.expiresAt < new Date()) {
        await this.sessionService.deleteSession(session.sessionId)
        throw new UnauthorizedException('Session expired')
      }

      // Get user
      const user = await this.usersService.findById(payload.sub)
      if (!user || user.isBlocked) {
        throw new UnauthorizedException('User not found or blocked')
      }

      // Extract roles as strings
      const userRoles = user.roles.map(r => r.role.toString())

      // Generate new tokens
      const tokens = await this.generateTokens(
        user.id,
        user.userId.toString(),
        userRoles,
        session.sessionId
      )

      // Update session with new refresh token
      await this.sessionService.updateSession(session.sessionId, {
        refreshToken: tokens.refreshToken,
        lastActivity: new Date()
      })

      this.logger.log(`Tokens refreshed for user: ${user.id}`)
      return tokens

    } catch (error) {
      this.logger.error('Token refresh failed:', error)
      throw new UnauthorizedException('Invalid refresh token')
    }
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessionService.deleteSession(sessionId)
    this.logger.log(`User logged out, session: ${sessionId}`)
  }

  async logoutAll(userId: number): Promise<number> {
    const count = await this.sessionService.deleteUserSessions(userId)
    this.logger.log(`User ${userId} logged out from all sessions: ${count}`)
    return count
  }

  async validateUser(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub)

    if (!user || user.isBlocked) {
      return null
    }

    // Verify session exists and is valid
    const session = await this.sessionService.getSession(payload.sessionId)
    if (!session || session.expiresAt < new Date()) {
      return null
    }

    // Update session activity
    await this.sessionService.updateSession(payload.sessionId, {
      lastActivity: new Date()
    })

    // Extract roles as strings
    const userRoles = user.roles.map(r => r.role.toString())

    return {
      id: user.id,
      telegramId: user.userId.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      roles: userRoles,
      isActive: user.isActive,
      isBlocked: user.isBlocked,
      sessionId: payload.sessionId
    }
  }

  async validateWebAppData(initData: string): Promise<boolean> {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN
      if (!botToken) {
        this.logger.error('TELEGRAM_BOT_TOKEN not configured')
        return false
      }

      // Parse init data
      const urlParams = new URLSearchParams(initData)
      const hash = urlParams.get('hash')

      if (!hash) {
        return false
      }

      // Remove hash from data
      urlParams.delete('hash')

      // Create data string for validation
      const dataCheckString = Array.from(urlParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n')

      // Create secret key
      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest()

      // Calculate expected hash
      const expectedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex')

      return hash === expectedHash

    } catch (error) {
      this.logger.error('WebApp data validation failed:', error)
      return false
    }
  }

  private validateTelegramAuth(loginDto: LoginDto): boolean {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN
      if (!botToken) {
        this.logger.error('TELEGRAM_BOT_TOKEN not configured')
        return false
      }

      // Create data string for validation
      const dataCheckString = [
        `auth_date=${loginDto.authDate}`,
        `first_name=${loginDto.firstName}`,
        loginDto.lastName ? `last_name=${loginDto.lastName}` : null,
        `id=${loginDto.telegramId}`,
        loginDto.username ? `username=${loginDto.username}` : null
      ]
        .filter(Boolean)
        .sort()
        .join('\n')

      // Calculate expected hash
      const secretKey = crypto
        .createHash('sha256')
        .update(botToken)
        .digest()

      const expectedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex')

      // Check if auth is not too old (24 hours)
      const authAge = Date.now() / 1000 - loginDto.authDate
      if (authAge > 86400) {
        this.logger.warn('Auth data is too old')
        return false
      }

      return loginDto.hash === expectedHash

    } catch (error) {
      this.logger.error('Telegram auth validation failed:', error)
      return false
    }
  }

  private parseWebAppUserData(initData: string) {
    try {
      const urlParams = new URLSearchParams(initData)
      const userStr = urlParams.get('user')

      if (!userStr) {
        return null
      }

      return JSON.parse(userStr)
    } catch (error) {
      this.logger.error('Failed to parse WebApp user data:', error)
      return null
    }
  }

  private async generateTokens(
    userId: number,
    telegramId: string,
    roles: string[],
    sessionId: string
  ): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: userId,
      telegramId,
      roles,
      sessionId
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: '15m' }),
      this.jwtService.signAsync(payload, { expiresIn: '7d' })
    ])

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 // 15 minutes in seconds
    }
  }
}
