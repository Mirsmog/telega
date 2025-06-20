import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleType } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 'clkj2l3k4j5l6k7j8l9k0',
  })
  id: string;

  @ApiProperty({
    description: 'Telegram user ID',
    example: '123456789',
  })
  telegramId: string;

  @ApiPropertyOptional({
    description: 'Username',
    example: 'john_doe',
  })
  username?: string;

  @ApiPropertyOptional({
    description: 'First name',
    example: 'John',
  })
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name',
    example: 'Doe',
  })
  lastName?: string;

  @ApiProperty({
    description: 'User role',
    enum: RoleType,
    example: RoleType.CUSTOMER,
  })
  role: RoleType;

  @ApiProperty({
    description: 'Account active status',
    example: true,
  })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'User balance',
    example: '100.50',
  })
  balance?: string;

  @ApiPropertyOptional({
    description: 'User frozen balance',
    example: '0.00',
  })
  frozenBalance?: string;

  @ApiPropertyOptional({
    description: 'Completed orders count',
    example: 5,
  })
  completedOrders?: number;

  @ApiPropertyOptional({
    description: 'Average rating',
    example: '4.5',
  })
  averageRating?: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 900,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
  })
  tokenType: string;

  @ApiProperty({
    description: 'User information',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}
