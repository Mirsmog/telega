import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { UserService } from '../user/user.service';
import { AuthResponseDto, LogoutDto, RefreshTokenDto, TelegramAuthDto } from './dto';
import { JwtPayload, JwtRefreshPayload, UserData } from './interfaces';
import { RedisTokenService } from './services/redis-token.service';
import { TelegramAuthService } from './services/telegram-auth.service';

// Type guard for JWT refresh payload
const isJwtRefreshPayload = (token: unknown): token is JwtRefreshPayload => {
  return (
    token &&
    typeof token === 'object' &&
    token !== null &&
    'sub' in token &&
    'tokenId' in token &&
    typeof (token as Record<string, unknown>).sub === 'string' &&
    typeof (token as Record<string, unknown>).tokenId === 'string'
  );
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtExpiresIn: string;
  private readonly jwtRefreshExpiresIn: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisTokenService: RedisTokenService,
    private readonly telegramAuthService: TelegramAuthService,
    private readonly userService: UserService,
  ) {
    this.jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m');
    this.jwtRefreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
  }

  /**
   * Authenticate user with Telegram data
   */
  async authenticateWithTelegram(telegramAuthDto: TelegramAuthDto): Promise<AuthResponseDto> {
    try {
      // Validate Telegram authentication
      this.telegramAuthService.validateTelegramAuth(telegramAuthDto);

      // Extract user data
      const userData = this.telegramAuthService.extractUserData(telegramAuthDto);

      // Find or create user using UserService
      const user = await this.userService.findOrCreateByTelegramData(userData);

      // Check user status
      if (!user.isActive) {
        throw new UnauthorizedException('User account is inactive');
      }

      if (user.isBanned) {
        throw new UnauthorizedException('User account is banned');
      }

      // Generate tokens
      const tokens = await this.generateTokens({
        id: user.id,
        telegramId: BigInt(user.telegramId),
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        isBanned: user.isBanned,
      });

      this.logger.log(`User authenticated: ${user.id}`);

      return {
        ...tokens,
        user: {
          id: user.id,
          telegramId: user.telegramId,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
        },
      };
    } catch (error) {
      this.logger.error('Telegram authentication failed:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    try {
      const { refreshToken } = refreshTokenDto;

      // Decode refresh token without verification
      const decodedToken: unknown = this.jwtService.decode(refreshToken);

      if (!isJwtRefreshPayload(decodedToken)) {
        throw new UnauthorizedException('Invalid refresh token format');
      }

      // Validate token in Redis
      const userId = await this.redisTokenService.validateRefreshToken(decodedToken.tokenId);

      if (!userId || userId !== decodedToken.sub) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Verify JWT signature
      try {
        await this.jwtService.verifyAsync(refreshToken);
      } catch (error) {
        // Remove invalid token from Redis
        await this.redisTokenService.revokeRefreshToken(decodedToken.tokenId);
        throw new UnauthorizedException('Invalid refresh token signature');
      }

      // Get user data using UserService
      const userForAuth = await this.userService.findForAuth(userId);

      if (!userForAuth) {
        await this.redisTokenService.revokeRefreshToken(decodedToken.tokenId);
        throw new UnauthorizedException('User not found');
      }

      if (!userForAuth.isActive || userForAuth.isBanned) {
        await this.redisTokenService.revokeRefreshToken(decodedToken.tokenId);
        throw new UnauthorizedException('User account is inactive or banned');
      }

      // Revoke old refresh token
      await this.redisTokenService.revokeRefreshToken(decodedToken.tokenId);

      // Generate new tokens
      const tokens = await this.generateTokens(userForAuth);

      // Update last seen using UserService
      await this.userService.updateLastSeen(userForAuth.id);

      this.logger.debug(`Token refreshed for user: ${userForAuth.id}`);

      return {
        ...tokens,
        user: {
          id: userForAuth.id,
          telegramId: userForAuth.telegramId.toString(),
          username: userForAuth.username,
          firstName: userForAuth.firstName,
          lastName: userForAuth.lastName,
          role: userForAuth.role,
          isActive: userForAuth.isActive,
        },
      };
    } catch (error) {
      this.logger.error('Token refresh failed:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Logout user and revoke refresh token
   */
  async logout(logoutDto: LogoutDto): Promise<{ message: string }> {
    try {
      const { refreshToken } = logoutDto;

      // Decode token to get tokenId
      const decodedToken: unknown = this.jwtService.decode(refreshToken);

      if (isJwtRefreshPayload(decodedToken)) {
        await this.redisTokenService.revokeRefreshToken(decodedToken.tokenId);
        this.logger.debug(`User logged out, token revoked: ${decodedToken.tokenId}`);
      }

      return { message: 'Successfully logged out' };
    } catch (error) {
      this.logger.error('Logout failed:', (error as Error).message);
      // Don't throw error for logout, just log it
      return { message: 'Logged out' };
    }
  }

  /**
   * Validate current access token and return user info
   */
  async validateToken(userId: string) {
    const user = await this.userService.validateUserStatus(userId);

    return {
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      balance: user.balance,
      frozenBalance: user.frozenBalance,
      completedOrders: user.completedOrders,
      averageRating: user.averageRating,
    };
  }

  /**
   * Revoke all tokens for a user (for security purposes)
   */
  async revokeAllUserTokens(userId: string): Promise<{ message: string }> {
    try {
      await this.redisTokenService.revokeAllUserTokens(userId);
      this.logger.log(`All tokens revoked for user: ${userId}`);
      return { message: 'All tokens revoked successfully' };
    } catch (error) {
      this.logger.error('Failed to revoke all user tokens:', (error as Error).message);
      throw new BadRequestException('Failed to revoke tokens');
    }
  }

  /**
   * Generate JWT access and refresh tokens
   */
  private async generateTokens(user: UserData): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  }> {
    const tokenId = randomUUID();

    // Create JWT payloads
    const jwtPayload: JwtPayload = {
      sub: user.id,
      telegramId: user.telegramId.toString(),
      username: user.username,
      role: user.role,
    };

    const refreshPayload: JwtRefreshPayload = {
      sub: user.id,
      tokenId,
    };

    // Generate tokens
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        expiresIn: this.jwtExpiresIn,
      }),
      this.jwtService.signAsync(refreshPayload, {
        expiresIn: this.jwtRefreshExpiresIn,
      }),
    ]);

    // Store refresh token in Redis
    const refreshExpiresInSeconds = this.parseTimeToSeconds(this.jwtRefreshExpiresIn);
    await this.redisTokenService.storeRefreshToken(tokenId, user.id, refreshExpiresInSeconds);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseTimeToSeconds(this.jwtExpiresIn),
      tokenType: 'Bearer',
    };
  }

  /**
   * Parse time string to seconds (e.g., '15m' to 900)
   * Convert time string to seconds - supports different time units
   */
  private parseTimeToSeconds(time: string): number {
    const match = time.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 900;
    } // Default 15 minutes

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        return 900;
    }
  }
}
