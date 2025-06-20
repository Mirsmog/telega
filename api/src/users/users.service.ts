import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { User } from '@prisma/client'
import { PrismaService } from '../common/prisma/prisma.service'
import { RoleType, UserWithRelations } from '../types/common.types'
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: number): Promise<UserWithRelations | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: true,
        userRegions: {
          include: { region: true }
        },
        vehicles: {
          include: { category: true }
        }
      },
    })

    return user as UserWithRelations | null
  }

  async findByTelegramId(userId: number): Promise<UserWithRelations | null> {
    const user = await this.prisma.user.findUnique({
      where: { userId: BigInt(userId) },
      include: {
        roles: true,
        userRegions: {
          include: { region: true }
        },
        vehicles: {
          include: { category: true }
        }
      },
    })

    return user as UserWithRelations | null
  }

  async createFromTelegram(data: {
    userId: number
    firstName: string
    lastName?: string
    username?: string
  }): Promise<UserWithRelations> {
    // Check if user already exists
    const existingUser = await this.findByTelegramId(data.userId)
    if (existingUser) {
      throw new ConflictException('User already exists')
    }

    // Generate referral code
    const refCode = this.generateRefCode()

    const user = await this.prisma.user.create({
      data: {
        userId: BigInt(data.userId),
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        refCode,
        roles: {
          create: [
            { role: RoleType.CUSTOMER }
          ]
        }
      },
      include: {
        roles: true,
        userRegions: {
          include: { region: true }
        },
        vehicles: {
          include: { category: true }
        }
      },
    })

    return user as UserWithRelations
  }

  async updateFromTelegram(id: number, data: {
    firstName?: string
    lastName?: string
    username?: string
  }): Promise<UserWithRelations> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        updatedAt: new Date(),
      },
      include: {
        roles: true,
        userRegions: {
          include: { region: true }
        },
        vehicles: {
          include: { category: true }
        }
      },
    })

    return user as UserWithRelations
  }

  async updateLastSeen(id: number): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastSeen: new Date() },
    })
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Check if user already exists
    const existingUser = await this.findByTelegramId(createUserDto.userId)
    if (existingUser) {
      throw new ConflictException('User already exists')
    }

    const refCode = this.generateRefCode()

    const user = await this.prisma.user.create({
      data: {
        userId: BigInt(createUserDto.userId),
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        username: createUserDto.username,
        phone: createUserDto.phone,
        refCode,
        parentRefCode: createUserDto.parentRefCode,
        roles: {
          create: createUserDto.roles?.map(role => ({ role })) || [
            { role: RoleType.CUSTOMER }
          ]
        }
      },
      include: {
        roles: true,
        userRegions: {
          include: { region: true }
        },
        vehicles: {
          include: { category: true }
        }
      },
    })

    return this.mapToResponseDto(user as UserWithRelations)
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.findById(id)
    if (!user) {
      throw new NotFoundException('User not found')
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: updateUserDto.firstName,
        lastName: updateUserDto.lastName,
        username: updateUserDto.username,
        phone: updateUserDto.phone,
        updatedAt: new Date(),
      },
      include: {
        roles: true,
        userRegions: {
          include: { region: true }
        },
        vehicles: {
          include: { category: true }
        }
      },
    })

    return this.mapToResponseDto(updatedUser as UserWithRelations)
  }

  async updateRoles(id: number, roles: RoleType[]): Promise<UserResponseDto> {
    const user = await this.findById(id)
    if (!user) {
      throw new NotFoundException('User not found')
    }

    // Delete existing roles
    await this.prisma.userRole.deleteMany({
      where: { userId: id }
    })

    // Create new roles
    await this.prisma.userRole.createMany({
      data: roles.map(role => ({ userId: id, role }))
    })

    const updatedUser = await this.findById(id)
    return this.mapToResponseDto(updatedUser!)
  }

  async updateBalance(id: number, type: 'customer' | 'performer' | 'referral', amount: number): Promise<void> {
    const updateData: {
      customerBalance?: number
      performerBalance?: number
      refBalance?: number
    } = {}

    switch (type) {
      case 'customer':
        updateData.customerBalance = amount
        break
      case 'performer':
        updateData.performerBalance = amount
        break
      case 'referral':
        updateData.refBalance = amount
        break
    }

    await this.prisma.user.update({
      where: { id },
      data: updateData,
    })
  }

  async addBalance(id: number, type: 'customer' | 'performer' | 'referral', amount: number): Promise<void> {
    const user = await this.findById(id)
    if (!user) {
      throw new NotFoundException('User not found')
    }

    const updateData: {
      customerBalance?: number
      performerBalance?: number
      refBalance?: number
    } = {}

    switch (type) {
      case 'customer':
        updateData.customerBalance = user.customerBalance.toNumber() + amount
        break
      case 'performer':
        updateData.performerBalance = user.performerBalance.toNumber() + amount
        break
      case 'referral':
        updateData.refBalance = user.refBalance.toNumber() + amount
        break
    }

    await this.prisma.user.update({
      where: { id },
      data: updateData,
    })
  }

  async blockUser(id: number, reason?: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        isBlocked: true,
        blockedAt: new Date(),
        isActive: false,
      },
    })
  }

  async unblockUser(id: number): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        isBlocked: false,
        blockedAt: null,
        isActive: true,
      },
    })
  }

  async getUserStats(id: number): Promise<{
    totalOrders: number
    completedOrders: number
    cancelledOrders: number
    rating: number
    customerBalance: number
    performerBalance: number
    refBalance: number
  }> {
    const user = await this.findById(id)
    if (!user) {
      throw new NotFoundException('User not found')
    }

    return {
      totalOrders: user.totalOrders,
      completedOrders: user.completedOrders,
      cancelledOrders: user.cancelledOrders,
      rating: user.rating,
      customerBalance: user.customerBalance.toNumber(),
      performerBalance: user.performerBalance.toNumber(),
      refBalance: user.refBalance.toNumber(),
    }
  }

  async findByRefCode(refCode: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { refCode },
    })
  }

  async getUsersByRole(role: RoleType): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      where: {
        roles: {
          some: { role }
        }
      },
      include: {
        roles: true,
        userRegions: {
          include: { region: true }
        },
        vehicles: {
          include: { category: true }
        }
      },
    })

    return users.map(user => this.mapToResponseDto(user as UserWithRelations))
  }

  private generateRefCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  mapToResponseDto(user: UserWithRelations): UserResponseDto {
    return {
      id: user.id,
      userId: Number(user.userId),
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      roles: user.roles.map(role => role.role),
      customerBalance: user.customerBalance.toNumber(),
      performerBalance: user.performerBalance.toNumber(),
      refBalance: user.refBalance.toNumber(),
      refCode: user.refCode,
      parentRefCode: user.parentRefCode,
      rating: user.rating,
      totalOrders: user.totalOrders,
      completedOrders: user.completedOrders,
      cancelledOrders: user.cancelledOrders,
      isActive: user.isActive,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastSeen: user.lastSeen,
      regions: user.userRegions?.map(ur => ({
        code: ur.region.code,
        name: ur.region.name,
        isActive: ur.isActive,
      })) || [],
      vehicles: user.vehicles?.map(vehicle => ({
        id: vehicle.id,
        categoryCode: vehicle.categoryCode,
        categoryName: vehicle.category.name,
        type: vehicle.type,
        subtype: vehicle.subtype,
        brand: vehicle.brand,
        model: vehicle.model,
        licensePlate: vehicle.licensePlate,
        isActive: vehicle.isActive,
      })) || [],
    }
  }
}
