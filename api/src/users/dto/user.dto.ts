import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsEnum, IsNumber, IsOptional, IsPhoneNumber, IsString } from 'class-validator'
import { RoleType } from '../../types/common.types'

// Re-export RoleType for backward compatibility
export { RoleType } from '../../types/common.types'

export class CreateUserDto {
  @ApiProperty({ description: 'Telegram user ID' })
  @IsNumber()
  userId: number

  @ApiProperty({ description: 'First name' })
  @IsString()
  firstName: string

  @ApiProperty({ description: 'Last name', required: false })
  @IsOptional()
  @IsString()
  lastName?: string

  @ApiProperty({ description: 'Username', required: false })
  @IsOptional()
  @IsString()
  username?: string

  @ApiProperty({ description: 'Phone number', required: false })
  @IsOptional()
  @IsPhoneNumber('RU')
  phone?: string

  @ApiProperty({ description: 'Parent referral code', required: false })
  @IsOptional()
  @IsString()
  parentRefCode?: string

  @ApiProperty({ description: 'User roles', enum: RoleType, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @IsEnum(RoleType, { each: true })
  roles?: RoleType[]
}

export class UpdateUserDto {
  @ApiProperty({ description: 'First name', required: false })
  @IsOptional()
  @IsString()
  firstName?: string

  @ApiProperty({ description: 'Last name', required: false })
  @IsOptional()
  @IsString()
  lastName?: string

  @ApiProperty({ description: 'Username', required: false })
  @IsOptional()
  @IsString()
  username?: string

  @ApiProperty({ description: 'Phone number', required: false })
  @IsOptional()
  @IsPhoneNumber('RU')
  phone?: string
}

export class UpdateUserRolesDto {
  @ApiProperty({ description: 'User roles', enum: RoleType, isArray: true })
  @IsArray()
  @IsEnum(RoleType, { each: true })
  roles: RoleType[]
}

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: number

  @ApiProperty({ description: 'Telegram user ID' })
  userId: number

  @ApiProperty({ description: 'Username', required: false })
  username?: string

  @ApiProperty({ description: 'First name' })
  firstName: string

  @ApiProperty({ description: 'Last name', required: false })
  lastName?: string

  @ApiProperty({ description: 'Phone number', required: false })
  phone?: string

  @ApiProperty({ description: 'User roles', enum: RoleType, isArray: true })
  roles: RoleType[]

  @ApiProperty({ description: 'Customer balance' })
  customerBalance: number

  @ApiProperty({ description: 'Performer balance' })
  performerBalance: number

  @ApiProperty({ description: 'Referral balance' })
  refBalance: number

  @ApiProperty({ description: 'Referral code' })
  refCode: string

  @ApiProperty({ description: 'Parent referral code', required: false })
  parentRefCode?: string

  @ApiProperty({ description: 'User rating' })
  rating: number

  @ApiProperty({ description: 'Total orders' })
  totalOrders: number

  @ApiProperty({ description: 'Completed orders' })
  completedOrders: number

  @ApiProperty({ description: 'Cancelled orders' })
  cancelledOrders: number

  @ApiProperty({ description: 'Is user active' })
  isActive: boolean

  @ApiProperty({ description: 'Is user blocked' })
  isBlocked: boolean

  @ApiProperty({ description: 'Created at' })
  createdAt: Date

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date

  @ApiProperty({ description: 'Last seen', required: false })
  lastSeen?: Date

  @ApiProperty({ description: 'User regions', isArray: true })
  regions: {
    code: string
    name: string
    isActive: boolean
  }[]

  @ApiProperty({ description: 'User vehicles', isArray: true })
  vehicles: {
    id: number
    categoryCode: string
    categoryName: string
    type: string
    subtype?: string
    brand?: string
    model?: string
    licensePlate?: string
    isActive: boolean
  }[]
}

export class UserStatsDto {
  @ApiProperty({ description: 'Total orders' })
  totalOrders: number

  @ApiProperty({ description: 'Completed orders' })
  completedOrders: number

  @ApiProperty({ description: 'Cancelled orders' })
  cancelledOrders: number

  @ApiProperty({ description: 'User rating' })
  rating: number

  @ApiProperty({ description: 'Customer balance' })
  customerBalance: number

  @ApiProperty({ description: 'Performer balance' })
  performerBalance: number

  @ApiProperty({ description: 'Referral balance' })
  refBalance: number
}

export class BalanceUpdateDto {
  @ApiProperty({ description: 'Balance type', enum: ['customer', 'performer', 'referral'] })
  @IsEnum(['customer', 'performer', 'referral'])
  type: 'customer' | 'performer' | 'referral'

  @ApiProperty({ description: 'Amount to add (can be negative)' })
  @IsNumber()
  amount: number
}
