export interface UserPayload {
    id: number;
    telegramId: string;
    roles: string[];
}
export declare const User: (...dataOrPipes: (keyof UserPayload | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>>)[]) => ParameterDecorator;
