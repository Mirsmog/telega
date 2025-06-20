import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator'

export class LoginDto {
  @ApiProperty({ description: 'Telegram user ID' })
  @IsString()
  @IsNotEmpty()
  telegramId: string

  @ApiProperty({ description: 'User first name' })
  @IsString()
  @IsNotEmpty()
  firstName: string

  @ApiProperty({ description: 'User last name', required: false })
  @IsString()
  @IsOptional()
  lastName?: string

  @ApiProperty({ description: 'Telegram username', required: false })
  @IsString()
  @IsOptional()
  username?: string

  @ApiProperty({ description: 'Authentication hash from Telegram' })
  @IsString()
  @IsNotEmpty()
  hash: string

  @ApiProperty({ description: 'Authentication timestamp' })
  @IsNumber()
  authDate: number

  @ApiProperty({ description: 'Device information', required: false })
  @IsString()
  @IsOptional()
  deviceInfo?: string

  @ApiProperty({ description: 'User IP address', required: false })
  @IsString()
  @IsOptional()
  ipAddress?: string

  @ApiProperty({ description: 'User agent string', required: false })
  @IsString()
  @IsOptional()
  userAgent?: string
}

export class TelegramWebAppLoginDto {
  @ApiProperty({ description: 'Telegram WebApp init data' })
  @IsString()
  @IsNotEmpty()
  initData: string

  @ApiProperty({ description: 'Device information', required: false })
  @IsString()
  @IsOptional()
  deviceInfo?: string

  @ApiProperty({ description: 'User IP address', required: false })
  @IsString()
  @IsOptional()
  ipAddress?: string

  @ApiProperty({ description: 'User agent string', required: false })
  @IsString()
  @IsOptional()
  userAgent?: string
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token', required: false })
  @IsString()
  @IsOptional()
  refreshToken?: string
}

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  access_token: string

  @ApiProperty({ description: 'Token type' })
  token_type: string

  @ApiProperty({ description: 'Token expiration in seconds' })
  expires_in: number

  @ApiProperty({ description: 'User information' })
  user: {
    id: number
    userId: number
    firstName: string
    lastName?: string
    username?: string
    roles: string[]
  }
} 