"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const response_interceptor_1 = require("./common/interceptors/response.interceptor");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('PORT', 3000);
    const apiPrefix = configService.get('API_PREFIX', 'api');
    const apiVersion = configService.get('API_VERSION', 'v1');
    app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);
    app.enableCors({
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Telega Logistics API')
        .setDescription('Маркетплейс логистических услуг через Telegram Bot')
        .setVersion('1.0')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
    }, 'JWT-auth')
        .addTag('auth', 'Аутентификация пользователей')
        .addTag('users', 'Управление пользователями')
        .addTag('orders', 'Заказы и матчинг')
        .addTag('payments', 'Платежи и балансы')
        .addTag('regions', 'Регионы и тарифы')
        .addTag('vehicles', 'Каталог транспорта')
        .addTag('admin', 'Административная панель')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });
    await app.listen(port);
    logger.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}/${apiVersion}`);
    logger.log(`📚 Swagger documentation: http://localhost:${port}/${apiPrefix}/docs`);
}
bootstrap().catch(err => {
    const logger = new common_1.Logger('Bootstrap');
    logger.error('❌ Error starting server:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map