import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Get configuration service
  const configService = app.get(ConfigService)

  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://localhost:3000',
      'https://localhost:3001',
      // Add your production domains here
    ],
    credentials: true,
  })

  // Global prefix for API
  const apiPrefix = configService.get('API_PREFIX', 'api')
  const apiVersion = configService.get('API_VERSION', 'v1')
  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`)

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Telega Logistics API')
    .setDescription('API для системы логистики Telega')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('orders', 'Order management endpoints')
    .addTag('payments', 'Payment processing endpoints')
    .addTag('regions', 'Region management endpoints')
    .addTag('vehicles', 'Vehicle management endpoints')
    .addTag('notifications', 'Notification endpoints')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  })

  // Get port from environment
  const port = configService.get('PORT', 3000)

  await app.listen(port)

  console.log(`🚀 Telega API is running on: http://localhost:${port}`)
  console.log(`📚 API Documentation: http://localhost:${port}/${apiPrefix}/docs`)
  console.log(`🔍 Health Check: http://localhost:${port}/${apiPrefix}/${apiVersion}/health`)
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error)
  process.exit(1)
})
