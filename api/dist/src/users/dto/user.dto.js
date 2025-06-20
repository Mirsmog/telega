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
exports.BalanceUpdateDto = exports.UserStatsDto = exports.UserResponseDto = exports.UpdateUserRolesDto = exports.UpdateUserDto = exports.CreateUserDto = exports.RoleType = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const common_types_1 = require("../../types/common.types");
var common_types_2 = require("../../types/common.types");
Object.defineProperty(exports, "RoleType", { enumerable: true, get: function () { return common_types_2.RoleType; } });
class CreateUserDto {
}
exports.CreateUserDto = CreateUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Telegram user ID' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateUserDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'First name' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Last name', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Username', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Phone number', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsPhoneNumber)('RU'),
    __metadata("design:type", String)
], CreateUserDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Parent referral code', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "parentRefCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User roles', enum: common_types_1.RoleType, isArray: true, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(common_types_1.RoleType, { each: true }),
    __metadata("design:type", Array)
], CreateUserDto.prototype, "roles", void 0);
class UpdateUserDto {
}
exports.UpdateUserDto = UpdateUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'First name', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Last name', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Username', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Phone number', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsPhoneNumber)('RU'),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "phone", void 0);
class UpdateUserRolesDto {
}
exports.UpdateUserRolesDto = UpdateUserRolesDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User roles', enum: common_types_1.RoleType, isArray: true }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(common_types_1.RoleType, { each: true }),
    __metadata("design:type", Array)
], UpdateUserRolesDto.prototype, "roles", void 0);
class UserResponseDto {
}
exports.UserResponseDto = UserResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User ID' }),
    __metadata("design:type", Number)
], UserResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Telegram user ID' }),
    __metadata("design:type", Number)
], UserResponseDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Username', required: false }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'First name' }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Last name', required: false }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Phone number', required: false }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User roles', enum: common_types_1.RoleType, isArray: true }),
    __metadata("design:type", Array)
], UserResponseDto.prototype, "roles", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Customer balance' }),
    __metadata("design:type", Number)
], UserResponseDto.prototype, "customerBalance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Performer balance' }),
    __metadata("design:type", Number)
], UserResponseDto.prototype, "performerBalance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Referral balance' }),
    __metadata("design:type", Number)
], UserResponseDto.prototype, "refBalance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Referral code' }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "refCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Parent referral code', required: false }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "parentRefCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User rating' }),
    __metadata("design:type", Number)
], UserResponseDto.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total orders' }),
    __metadata("design:type", Number)
], UserResponseDto.prototype, "totalOrders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Completed orders' }),
    __metadata("design:type", Number)
], UserResponseDto.prototype, "completedOrders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Cancelled orders' }),
    __metadata("design:type", Number)
], UserResponseDto.prototype, "cancelledOrders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Is user active' }),
    __metadata("design:type", Boolean)
], UserResponseDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Is user blocked' }),
    __metadata("design:type", Boolean)
], UserResponseDto.prototype, "isBlocked", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Created at' }),
    __metadata("design:type", Date)
], UserResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Updated at' }),
    __metadata("design:type", Date)
], UserResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Last seen', required: false }),
    __metadata("design:type", Date)
], UserResponseDto.prototype, "lastSeen", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User regions', isArray: true }),
    __metadata("design:type", Array)
], UserResponseDto.prototype, "regions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User vehicles', isArray: true }),
    __metadata("design:type", Array)
], UserResponseDto.prototype, "vehicles", void 0);
class UserStatsDto {
}
exports.UserStatsDto = UserStatsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total orders' }),
    __metadata("design:type", Number)
], UserStatsDto.prototype, "totalOrders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Completed orders' }),
    __metadata("design:type", Number)
], UserStatsDto.prototype, "completedOrders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Cancelled orders' }),
    __metadata("design:type", Number)
], UserStatsDto.prototype, "cancelledOrders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User rating' }),
    __metadata("design:type", Number)
], UserStatsDto.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Customer balance' }),
    __metadata("design:type", Number)
], UserStatsDto.prototype, "customerBalance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Performer balance' }),
    __metadata("design:type", Number)
], UserStatsDto.prototype, "performerBalance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Referral balance' }),
    __metadata("design:type", Number)
], UserStatsDto.prototype, "refBalance", void 0);
class BalanceUpdateDto {
}
exports.BalanceUpdateDto = BalanceUpdateDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Balance type', enum: ['customer', 'performer', 'referral'] }),
    (0, class_validator_1.IsEnum)(['customer', 'performer', 'referral']),
    __metadata("design:type", String)
], BalanceUpdateDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Amount to add (can be negative)' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], BalanceUpdateDto.prototype, "amount", void 0);
//# sourceMappingURL=user.dto.js.map