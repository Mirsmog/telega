"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    app.enableCors({
        origin: [
            'http://localhost:3000',
            'http://localhost:3001',
            'https://localhost:3000',
            'https://localhost:3001',
        ],
        credentials: true,
    });
    const apiPrefix = configService.get('API_PREFIX', 'api');
    const apiVersion = configService.get('API_VERSION', 'v1');
    app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Telega Logistics API')
        .setDescription('API для системы логистики Telega')
        .setVersion('1.0')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
    }, 'JWT-auth')
        .addTag('auth', 'Authentication endpoints')
        .addTag('users', 'User management endpoints')
        .addTag('orders', 'Order management endpoints')
        .addTag('payments', 'Payment processing endpoints')
        .addTag('regions', 'Region management endpoints')
        .addTag('vehicles', 'Vehicle management endpoints')
        .addTag('notifications', 'Notification endpoints')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });
    const port = configService.get('PORT', 3000);
    await app.listen(port);
    console.log(`🚀 Telega API is running on: http://localhost:${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/${apiPrefix}/docs`);
    console.log(`🔍 Health Check: http://localhost:${port}/${apiPrefix}/${apiVersion}/health`);
}
bootstrap().catch((error) => {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map