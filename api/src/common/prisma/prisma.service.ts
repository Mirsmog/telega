import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { NestApplication } from '../../types/common.types'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    })
  }

  async onModuleInit() {
    await this.$connect()
    console.log('✅ Database connected successfully')
  }

  async onModuleDestroy() {
    await this.$disconnect()
    console.log('🔌 Database disconnected')
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return

    // The order matters because of foreign key constraints
    const models = [
      'userSession',
      'notification',
      'orderHistory',
      'payment',
      'order',
      'vehicle',
      'userRegion',
      'userRole',
      'user',
      'region',
      'vehicleCategory',
      'systemSetting',
    ]

    for (const model of models) {
      const prismaModel = (this as any)[model]
      if (prismaModel && prismaModel.deleteMany) {
        await prismaModel.deleteMany()
      }
    }
  }

  async enableShutdownHooks(app: NestApplication) {
    // Graceful shutdown hooks
    const exitHandler = async () => {
      await app.close()
    }

    process.on('SIGINT', exitHandler)
    process.on('SIGTERM', exitHandler)
  }
}
