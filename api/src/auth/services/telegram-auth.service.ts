import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { TelegramAuthDto } from '../dto';

@Injectable()
export class TelegramAuthService {
  private readonly logger = new Logger(TelegramAuthService.name);
  private readonly botToken: string;

  constructor(private readonly configService: ConfigService) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!this.botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }
  }

  /**
   * Validate Telegram authentication data
   * Based on Telegram Login Widget documentation
   */
  validateTelegramAuth(authData: TelegramAuthDto): boolean {
    try {
      const { hash, ...dataToCheck } = authData;

      // Check if auth is not too old (5 minutes)
      const authAge = Date.now() / 1000 - authData.auth_date;
      if (authAge > 300) {
        this.logger.warn('Telegram auth data is too old');
        throw new UnauthorizedException('Authentication data is too old');
      }

      // Create data check string
      const dataCheckString = Object.keys(dataToCheck)
        .filter(key => dataToCheck[key] !== undefined && dataToCheck[key] !== null)
        .sort()
        .map(key => `${key}=${dataToCheck[key]}`)
        .join('\n');

      // Create secret key from bot token
      const secretKey = createHmac('sha256', 'WebAppData').update(this.botToken).digest();

      // Create hash from data
      const calculatedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

      // Compare hashes
      const isValid = calculatedHash === hash;

      if (!isValid) {
        this.logger.warn('Invalid Telegram authentication hash');
        throw new UnauthorizedException('Invalid authentication data');
      }

      this.logger.debug(`Telegram auth validated for user ${authData.id}`);
      return true;
    } catch (error) {
      this.logger.error('Telegram auth validation failed:', (error as Error).message);
      throw new UnauthorizedException('Authentication validation failed');
    }
  }

  /**
   * Extract user data from Telegram auth
   */
  extractUserData(authData: TelegramAuthDto) {
    return {
      telegramId: BigInt(authData.id),
      username: authData.username,
      firstName: authData.first_name,
      lastName: authData.last_name,
      photoUrl: authData.photo_url,
    };
  }

  /**
   * Generate a verification challenge for additional security
   */
  generateChallenge(): string {
    return createHmac('sha256', this.botToken)
      .update(Math.random().toString())
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Verify challenge response
   */
  verifyChallenge(challenge: string, response: string, telegramId: number): boolean {
    const expectedResponse = createHmac('sha256', this.botToken)
      .update(`${challenge}:${telegramId}`)
      .digest('hex');

    return expectedResponse === response;
  }
}
