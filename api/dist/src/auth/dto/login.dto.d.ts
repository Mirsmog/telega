export declare class LoginDto {
    telegramId: string;
    firstName: string;
    lastName?: string;
    username?: string;
    hash: string;
    authDate: number;
    deviceInfo?: string;
    ipAddress?: string;
    userAgent?: string;
}
export declare class TelegramWebAppLoginDto {
    initData: string;
    deviceInfo?: string;
    ipAddress?: string;
    userAgent?: string;
}
export declare class RefreshTokenDto {
    refreshToken?: string;
}
export declare class LoginResponseDto {
    access_token: string;
    token_type: string;
    expires_in: number;
    user: {
        id: number;
        userId: number;
        firstName: string;
        lastName?: string;
        username?: string;
        roles: string[];
    };
}
