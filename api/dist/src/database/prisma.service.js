"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
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
        this.logger = new common_1.Logger(PrismaService_1.name);
        if (process.env.NODE_ENV === 'development') {
            this.$on('query', (e) => {
                this.logger.debug(`Query: ${e.query} -- Params: ${e.params} -- Duration: ${e.duration}ms`);
            });
        }
    }
    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('Successfully connected to database');
        }
        catch (error) {
            this.logger.error('Failed to connect to database', error);
            throw error;
        }
    }
    async onModuleDestroy() {
        try {
            await this.$disconnect();
            this.logger.log('Disconnected from database');
        }
        catch (error) {
            this.logger.error('Error during database disconnection', error);
        }
    }
    async cleanDatabase(excludeTables = []) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Database cleanup is not allowed in production');
        }
        const tablenames = await this.$queryRaw `
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;
        const tables = tablenames
            .map(({ tablename }) => tablename)
            .filter((name) => name !== '_prisma_migrations' && !excludeTables.includes(name));
        try {
            for (const table of tables) {
                await this.$executeRawUnsafe(`TRUNCATE TABLE "public"."${table}" CASCADE;`);
            }
        }
        catch (error) {
            this.logger.error('Error cleaning database', error);
            throw error;
        }
    }
    async executeTransaction(callback, maxRetries = 3) {
        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                return await this.$transaction(async (prisma) => {
                    return callback(prisma);
                });
            }
            catch (error) {
                attempt++;
                if (attempt >= maxRetries) {
                    this.logger.error(`Transaction failed after ${maxRetries} attempts`, error);
                    throw error;
                }
                const delay = Math.pow(2, attempt) * 100;
                await new Promise(resolve => setTimeout(resolve, delay));
                this.logger.warn(`Transaction attempt ${attempt} failed, retrying in ${delay}ms...`);
            }
        }
        throw new Error('Transaction failed - this should never be reached');
    }
    async healthCheck() {
        try {
            await this.$queryRaw `SELECT 1`;
            return {
                status: 'healthy',
                timestamp: new Date(),
            };
        }
        catch (error) {
            this.logger.error('Database health check failed', error);
            throw error;
        }
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map