import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsDefined, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Telegram user ID',
    example: 123456789,
  })
  @IsDefined()
  @Type(() => BigInt)
  @Transform(({ value }: { value: string | number }) => BigInt(value))
  telegramId: bigint;

  @ApiPropertyOptional({
    description: 'Username',
    example: 'john_doe',
  })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({
    description: 'First name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

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
    description: 'Photo URL',
    example: 'https://t.me/i/userpic/320/username.jpg',
  })
  @IsString()
  @IsOptional()
  photoUrl?: string;
}
