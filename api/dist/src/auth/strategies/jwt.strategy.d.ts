import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { AuthenticatedUser, JwtPayload } from '../interfaces/auth.interface';
import { AuthService } from '../services/auth.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private authService;
    constructor(configService: ConfigService, authService: AuthService);
    validate(payload: JwtPayload): Promise<AuthenticatedUser>;
}
export {};
