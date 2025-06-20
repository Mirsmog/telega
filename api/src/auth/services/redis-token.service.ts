import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisTokenService {
  private readonly logger = new Logger(RedisTokenService.name);
  private readonly redis: Redis;
  private readonly REFRESH_TOKEN_PREFIX = 'refresh_token:';
  private readonly BLACKLIST_PREFIX = 'blacklist:';

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB', 0),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.redis.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.redis.on('error', error => {
      this.logger.error('Redis connection error:', error);
    });
  }

  /**
   * Store refresh token in Redis with expiration
   */
  async storeRefreshToken(tokenId: string, userId: string, expiresIn: number): Promise<void> {
    const key = `${this.REFRESH_TOKEN_PREFIX}${tokenId}`;

    try {
      await this.redis.setex(key, expiresIn, userId);
      this.logger.debug(`Stored refresh token ${tokenId} for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to store refresh token: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Validate refresh token and get user ID
   */
  async validateRefreshToken(tokenId: string): Promise<string | null> {
    const key = `${this.REFRESH_TOKEN_PREFIX}${tokenId}`;

    try {
      const userId = await this.redis.get(key);
      return userId;
    } catch (error) {
      this.logger.error(`Failed to validate refresh token: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(tokenId: string): Promise<void> {
    const key = `${this.REFRESH_TOKEN_PREFIX}${tokenId}`;

    try {
      await this.redis.del(key);
      this.logger.debug(`Revoked refresh token ${tokenId}`);
    } catch (error) {
      this.logger.error(`Failed to revoke refresh token: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      const pattern = `${this.REFRESH_TOKEN_PREFIX}*`;
      const keys = await this.redis.keys(pattern);

      if (keys.length === 0) {
        return;
      }

      // Get all tokens and filter by user ID
      const pipeline = this.redis.pipeline();
      keys.forEach(key => pipeline.get(key));
      const results = await pipeline.exec();

      const tokensToRevoke: string[] = [];
      results?.forEach((result, index) => {
        if (result && result[1] === userId) {
          tokensToRevoke.push(keys[index]);
        }
      });

      if (tokensToRevoke.length > 0) {
        await this.redis.del(...tokensToRevoke);
        this.logger.debug(`Revoked ${tokensToRevoke.length} tokens for user ${userId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to revoke user tokens: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Add token to blacklist
   */
  async blacklistToken(jti: string, expiresIn: number): Promise<void> {
    const key = `${this.BLACKLIST_PREFIX}${jti}`;

    try {
      await this.redis.setex(key, expiresIn, 'blacklisted');
      this.logger.debug(`Blacklisted token ${jti}`);
    } catch (error) {
      this.logger.error(`Failed to blacklist token: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const key = `${this.BLACKLIST_PREFIX}${jti}`;

    try {
      const result = await this.redis.get(key);
      return result !== null;
    } catch (error) {
      this.logger.error(`Failed to check token blacklist: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Get Redis health status
   */
  async getHealth(): Promise<{ status: string; message?: string }> {
    try {
      await this.redis.ping();
      return { status: 'healthy' };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: (error as Error).message,
      };
    }
  }

  /**
   * Cleanup expired tokens (called by scheduler)
   */
  async cleanupExpiredTokens(): Promise<void> {
    this.logger.debug('Starting cleanup of expired tokens');

    try {
      // Redis automatically handles TTL cleanup, but we can log the operation
      const refreshTokenCount = (await this.redis.eval(
        "return #redis.call('keys', ARGV[1])",
        0,
        `${this.REFRESH_TOKEN_PREFIX}*`,
      )) as number;

      const blacklistCount = (await this.redis.eval(
        "return #redis.call('keys', ARGV[1])",
        0,
        `${this.BLACKLIST_PREFIX}*`,
      )) as number;

      this.logger.debug(
        `Token cleanup completed. Active refresh tokens: ${refreshTokenCount}, Blacklisted tokens: ${blacklistCount}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Token cleanup failed: ${errorMessage}`);
    }
  }

  async onApplicationShutdown(): Promise<void> {
    await this.redis.quit();
    this.logger.log('Redis connection closed');
  }
}
