import { ApiPropertyOptional } from '@nestjs/swagger';
import { RoleType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Username',
    example: 'john_doe',
  })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({
    description: 'First name',
    example: 'John',
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name',
    example: 'Doe',
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+1234567890',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'john@example.com',
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: RoleType,
    example: RoleType.CUSTOMER,
  })
  @IsEnum(RoleType)
  @IsOptional()
  role?: RoleType;

  @ApiPropertyOptional({
    description: 'Account active status',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Account banned status',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isBanned?: boolean;

  @ApiPropertyOptional({
    description: 'Ban reason',
    example: 'Violation of terms of service',
  })
  @IsString()
  @IsOptional()
  banReason?: string;

  @ApiPropertyOptional({
    description: 'Order limit',
    example: 5,
  })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  orderLimit?: number;

  @ApiPropertyOptional({
    description: 'Create limit',
    example: 3,
  })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  createLimit?: number;

  @ApiPropertyOptional({
    description: 'Notifications enabled',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  notificationsEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Email notifications enabled',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean;
}
