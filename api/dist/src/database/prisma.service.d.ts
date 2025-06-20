import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    cleanDatabase(excludeTables?: string[]): Promise<void>;
    executeTransaction<T>(callback: (prisma: any) => Promise<T>, maxRetries?: number): Promise<T>;
    healthCheck(): Promise<{
        status: string;
        timestamp: Date;
    }>;
}
