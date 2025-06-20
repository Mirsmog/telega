import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class TelegramAuthDto {
  @ApiProperty({
    description: 'Telegram user ID',
    example: 123456789,
  })
  @IsNumber()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  id: number;

  @ApiPropertyOptional({
    description: 'Telegram username',
    example: 'john_doe',
  })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  first_name: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @IsOptional()
  last_name?: string;

  @ApiPropertyOptional({
    description: 'User photo URL',
    example: 'https://t.me/i/userpic/320/username.jpg',
  })
  @IsString()
  @IsOptional()
  photo_url?: string;

  @ApiProperty({
    description: 'Authentication date timestamp',
    example: 1640995200,
  })
  @IsNumber()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  auth_date: number;

  @ApiProperty({
    description: 'Hash for verification',
    example: 'abc123def456...',
  })
  @IsString()
  hash: string;
}
