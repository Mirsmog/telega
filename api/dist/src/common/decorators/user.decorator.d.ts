export interface UserPayload {
    id: number;
    telegramId: string;
    roles: string[];
}
export declare const User: (...dataOrPipes: (import("@nestjs/common").PipeTransform<any, any> | keyof UserPayload | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>>)[]) => ParameterDecorator;
