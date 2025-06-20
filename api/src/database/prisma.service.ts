import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'info', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
      errorFormat: 'colorless',
    });

    // Subscribe to query events for logging in development
    if (process.env.NODE_ENV === 'development') {
      (this as any).$on('query', (e: any) => {
        this.logger.debug(`Query: ${e.query} -- Params: ${e.params} -- Duration: ${e.duration}ms`);
      });
    }
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to database');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.$disconnect();
      this.logger.log('Disconnected from database');
    } catch (error) {
      this.logger.error('Error during database disconnection', error);
    }
  }

  /**
   * Clean database - for testing purposes only
   * @param excludeTables - Array of table names to exclude from cleanup
   */
  async cleanDatabase(excludeTables: string[] = []): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Database cleanup is not allowed in production');
    }

    const tablenames = await this.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name: string) => name !== '_prisma_migrations' && !excludeTables.includes(name));

    try {
      for (const table of tables) {
        await this.$executeRawUnsafe(`TRUNCATE TABLE "public"."${table}" CASCADE;`);
      }
    } catch (error) {
      this.logger.error('Error cleaning database', error);
      throw error;
    }
  }

  /**
   * Execute transaction with retry logic
   */
  async executeTransaction<T>(
    callback: (prisma: any) => Promise<T>,
    maxRetries: number = 3,
  ): Promise<T> {
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        return await this.$transaction(async prisma => {
          return callback(prisma);
        });
      } catch (error) {
        attempt++;

        if (attempt >= maxRetries) {
          this.logger.error(`Transaction failed after ${maxRetries} attempts`, error);
          throw error;
        }

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 100;
        await new Promise(resolve => setTimeout(resolve, delay));

        this.logger.warn(`Transaction attempt ${attempt} failed, retrying in ${delay}ms...`);
      }
    }

    throw new Error('Transaction failed - this should never be reached');
  }

  /**
   * Check database health
   */
  async healthCheck(): Promise<{ status: string; timestamp: Date }> {
    try {
      await this.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      throw error;
    }
  }
}
