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

  @ApiProperty({
    description: 'First name',
    example: 'John',
  })
  firstName: string;

  @ApiPropertyOptional({
    description: 'Last name',
    example: 'Doe',
  })
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+1234567890',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'john@example.com',
  })
  email?: string;

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

  @ApiProperty({
    description: 'Account banned status',
    example: false,
  })
  isBanned: boolean;

  @ApiPropertyOptional({
    description: 'Ban reason',
    example: 'Violation of terms of service',
  })
  banReason?: string;

  @ApiProperty({
    description: 'User balance',
    example: '100.50',
  })
  balance: string;

  @ApiProperty({
    description: 'User frozen balance',
    example: '0.00',
  })
  frozenBalance: string;

  @ApiProperty({
    description: 'Total earned amount',
    example: '500.00',
  })
  totalEarned: string;

  @ApiProperty({
    description: 'Order limit',
    example: 2,
  })
  orderLimit: number;

  @ApiProperty({
    description: 'Create limit',
    example: 2,
  })
  createLimit: number;

  @ApiProperty({
    description: 'Completed orders count',
    example: 5,
  })
  completedOrders: number;

  @ApiProperty({
    description: 'Cancelled orders count',
    example: 1,
  })
  cancelledOrders: number;

  @ApiProperty({
    description: 'Average rating',
    example: '4.5',
  })
  averageRating: string;

  @ApiProperty({
    description: 'Total reviews count',
    example: 10,
  })
  totalReviews: number;

  @ApiProperty({
    description: 'Has active plan',
    example: false,
  })
  hasActivePlan: boolean;

  @ApiPropertyOptional({
    description: 'Plan expiration date',
    example: '2024-12-31T23:59:59.000Z',
  })
  planExpiresAt?: Date;

  @ApiPropertyOptional({
    description: 'Referral code',
    example: 'REF123ABC',
  })
  referralCode?: string;

  @ApiProperty({
    description: 'Notifications enabled',
    example: true,
  })
  notificationsEnabled: boolean;

  @ApiProperty({
    description: 'Email notifications enabled',
    example: false,
  })
  emailNotifications: boolean;

  @ApiPropertyOptional({
    description: 'Last seen at',
    example: '2024-01-15T10:30:00.000Z',
  })
  lastSeenAt?: Date;

  @ApiProperty({
    description: 'Account created at',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Account updated at',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;
}
