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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class UserResponseDto {
}
exports.UserResponseDto = UserResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User ID',
        example: 'clkj2l3k4j5l6k7j8l9k0',
    }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Telegram user ID',
        example: '123456789',
    }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "telegramId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Username',
        example: 'john_doe',
    }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'First name',
        example: 'John',
    }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Last name',
        example: 'Doe',
    }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Phone number',
        example: '+1234567890',
    }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Email address',
        example: 'john@example.com',
    }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User role',
        enum: client_1.RoleType,
        example: client_1.RoleType.CUSTOMER,
    }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account active status',
        example: true,
    }),
    __metadata("design:type", Boolean)
], UserResponseDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account banned status',
        example: false,
    }),
    __metadata("design:type", Boolean)
], UserResponseDto.prototype, "isBanned", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Ban reason',
        example: 'Violation of terms of service',
    }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "banReason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User balance',
        example: '100.50',
    }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "balance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User frozen balance',
        example: '0.00',
    }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "frozenBalance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total earned amount',
        example: '500.00',
    }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "totalEarned", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Order limit',
        example: 2,
    }),
    __metadata("design:type", Number)
], UserResponseDto.prototype, "orderLimit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Create limit',
        example: 2,
    }),
    __metadata("design:type", Number)
], UserResponseDto.prototype, "createLimit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Completed orders count',
        example: 5,
    }),
    __metadata("design:type", Number)
], UserResponseDto.prototype, "completedOrders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Cancelled orders count',
        example: 1,
    }),
    __metadata("design:type", Number)
], UserResponseDto.prototype, "cancelledOrders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Average rating',
        example: '4.5',
    }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "averageRating", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total reviews count',
        example: 10,
    }),
    __metadata("design:type", Number)
], UserResponseDto.prototype, "totalReviews", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Has active plan',
        example: false,
    }),
    __metadata("design:type", Boolean)
], UserResponseDto.prototype, "hasActivePlan", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Plan expiration date',
        example: '2024-12-31T23:59:59.000Z',
    }),
    __metadata("design:type", Date)
], UserResponseDto.prototype, "planExpiresAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Referral code',
        example: 'REF123ABC',
    }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "referralCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Notifications enabled',
        example: true,
    }),
    __metadata("design:type", Boolean)
], UserResponseDto.prototype, "notificationsEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Email notifications enabled',
        example: false,
    }),
    __metadata("design:type", Boolean)
], UserResponseDto.prototype, "emailNotifications", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Last seen at',
        example: '2024-01-15T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], UserResponseDto.prototype, "lastSeenAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account created at',
        example: '2023-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], UserResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account updated at',
        example: '2024-01-15T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], UserResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=user-response.dto.js.map