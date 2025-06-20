import { ConfigService } from '@nestjs/config';
import { TelegramAuthDto } from '../dto';
export declare class TelegramAuthService {
    private readonly configService;
    private readonly logger;
    private readonly botToken;
    constructor(configService: ConfigService);
    validateTelegramAuth(authData: TelegramAuthDto): boolean;
    extractUserData(authData: TelegramAuthDto): {
        telegramId: bigint;
        username: string;
        firstName: string;
        lastName: string;
        photoUrl: string;
    };
    generateChallenge(): string;
    verifyChallenge(challenge: string, response: string, telegramId: number): boolean;
}
