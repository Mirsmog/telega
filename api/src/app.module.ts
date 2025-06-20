import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './database/prisma.module';

@Module({
  imports: [
    // Global Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate Limiting
    ThrottlerModule.forRoot({
      ttl: 60, // seconds
      limit: 10, // requests per ttl
    }),

    // Database
    PrismaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
