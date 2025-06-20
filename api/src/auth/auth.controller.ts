import { Controller, Post, Body, UseGuards, Get, Delete, HttpCode, HttpStatus, Res, Req } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger'
import { Response, Request } from 'express'
import { AuthService } from './services/auth.service'
import { SessionService } from './services/session.service'
import { LoginDto, TelegramWebAppLoginDto, RefreshTokenDto } from './dto/login.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { CurrentUser } from './decorators/current-user.decorator'
import { Public } from './decorators/public.decorator'
import { AuthenticatedUser, LoginResponse, TokenPair, TelegramUser } from './interfaces/auth.interface'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService
  ) {}

  @Public()
  @Post('telegram/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login via Telegram Bot' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            telegramId: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            username: { type: 'string' },
            roles: { type: 'array', items: { type: 'string' } },
            isActive: { type: 'boolean' },
            isBlocked: { type: 'boolean' }
          }
        },
        tokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            expiresIn: { type: 'number' }
          }
        },
        session: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
            expiresAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid login data' })
  @ApiResponse({ status: 401, description: 'Authentication failed' })
  async telegramLogin(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<LoginResponse> {
    const result = await this.authService.loginWithTelegram(loginDto)
    
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/v1/auth'
    })

    return result
  }

  @Public()
  @Post('webapp/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login via Telegram WebApp' })
  @ApiBody({ type: TelegramWebAppLoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'WebApp login successful',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            telegramId: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            username: { type: 'string' },
            roles: { type: 'array', items: { type: 'string' } },
            isActive: { type: 'boolean' },
            isBlocked: { type: 'boolean' }
          }
        },
        tokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            expiresIn: { type: 'number' }
          }
        },
        session: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
            expiresAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid WebApp data' })
  @ApiResponse({ status: 401, description: 'WebApp authentication failed' })
  async webAppLogin(
    @Body() webAppLoginDto: TelegramWebAppLoginDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<LoginResponse> {
    const result = await this.authService.loginWithWebApp(webAppLoginDto)
    
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/v1/auth'
    })

    return result
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ 
    type: RefreshTokenDto,
    description: 'Refresh token can be provided in body or will be read from httpOnly cookie'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        expiresIn: { type: 'number' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async refresh(
    @Body() refreshDto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<TokenPair> {
    // Get refresh token from body or cookie
    const refreshToken = refreshDto.refreshToken || req.cookies?.refreshToken

    if (!refreshToken) {
      throw new Error('Refresh token not provided')
    }

    const tokens = await this.authService.refreshTokens(refreshToken)
    
    // Update refresh token cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/v1/auth'
    })

    return tokens
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout current session' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response
  ): Promise<{ message: string }> {
    await this.authService.logout(user.sessionId)
    
    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      path: '/api/v1/auth'
    })

    return { message: 'Logout successful' }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout from all sessions' })
  @ApiResponse({ status: 200, description: 'Logout from all sessions successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logoutAll(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response
  ): Promise<{ message: string; sessionsTerminated: number }> {
    const count = await this.authService.logoutAll(user.id)
    
    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      path: '/api/v1/auth'
    })

    return { 
      message: 'Logout from all sessions successful',
      sessionsTerminated: count
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({ 
    status: 200, 
    description: 'Current user information',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        telegramId: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        username: { type: 'string' },
        roles: { type: 'array', items: { type: 'string' } },
        isActive: { type: 'boolean' },
        isBlocked: { type: 'boolean' },
        session: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
            expiresAt: { type: 'string', format: 'date-time' },
            lastActivity: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<{
    id: number
    telegramId: string
    firstName: string
    lastName?: string
    username?: string
    roles: string[]
    isActive: boolean
    isBlocked: boolean
    session: {
      sessionId: string
      expiresAt: Date
      lastActivity: Date
    }
  }> {
    const session = await this.sessionService.getSession(user.sessionId)
    
    return {
      id: user.id,
      telegramId: user.telegramId,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      roles: user.roles,
      isActive: user.isActive,
      isBlocked: user.isBlocked,
      session: {
        sessionId: session!.sessionId,
        expiresAt: session!.expiresAt,
        lastActivity: session!.lastActivity
      }
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all user sessions' })
  @ApiResponse({ 
    status: 200, 
    description: 'User sessions list',
    schema: {
      type: 'object',
      properties: {
        sessions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              deviceInfo: { type: 'string' },
              ipAddress: { type: 'string' },
              userAgent: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              lastActivity: { type: 'string', format: 'date-time' },
              expiresAt: { type: 'string', format: 'date-time' },
              isCurrent: { type: 'boolean' }
            }
          }
        },
        total: { type: 'number' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSessions(@CurrentUser() user: AuthenticatedUser): Promise<{
    sessions: Array<{
      sessionId: string
      deviceInfo?: string
      ipAddress?: string
      userAgent?: string
      createdAt: Date
      lastActivity: Date
      expiresAt: Date
      isCurrent: boolean
    }>
    total: number
  }> {
    const sessions = await this.sessionService.getUserSessions(user.id)
    
    const sessionList = sessions.map(session => ({
      sessionId: session.sessionId,
      deviceInfo: session.deviceInfo,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      expiresAt: session.expiresAt,
      isCurrent: session.sessionId === user.sessionId
    }))

    return {
      sessions: sessionList,
      total: sessionList.length
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:sessionId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Terminate specific session' })
  @ApiResponse({ status: 200, description: 'Session terminated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async terminateSession(
    @CurrentUser() user: AuthenticatedUser,
    @Body('sessionId') sessionId: string
  ): Promise<{ message: string }> {
    await this.sessionService.deleteSession(sessionId, user.id)
    return { message: 'Session terminated successfully' }
  }

  @Public()
  @Get('validate-webapp')
  @ApiOperation({ summary: 'Validate Telegram WebApp init data' })
  @ApiResponse({ status: 200, description: 'WebApp data is valid' })
  @ApiResponse({ status: 400, description: 'Invalid WebApp data' })
  async validateWebApp(@Body('initData') initData: string): Promise<{
    valid: boolean
    user?: TelegramUser
  }> {
    try {
      const isValid = await this.authService.validateWebAppData(initData)
      
      if (isValid) {
        // Parse user data from initData
        const urlParams = new URLSearchParams(initData)
        const userStr = urlParams.get('user')
        const user = userStr ? JSON.parse(userStr) : null

        return {
          valid: true,
          user
        }
      }

      return { valid: false }
    } catch (error) {
      return { valid: false }
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-token')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Verify current access token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Token is valid',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            telegramId: { type: 'string' },
            roles: { type: 'array', items: { type: 'string' } }
          }
        },
        expiresIn: { type: 'number', description: 'Seconds until token expires' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async verifyToken(@CurrentUser() user: AuthenticatedUser): Promise<{
    valid: boolean
    user: {
      id: number
      telegramId: string
      roles: string[]
    }
    expiresIn: number
  }> {
    // Token is valid if we reach this point (JwtAuthGuard passed)
    const session = await this.sessionService.getSession(user.sessionId)
    const expiresIn = session ? Math.floor((session.expiresAt.getTime() - Date.now()) / 1000) : 0

    return {
      valid: true,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        roles: user.roles
      },
      expiresIn
    }
  }
} 