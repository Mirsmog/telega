import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RoleType } from '@prisma/client';
import type { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto';

// Interface for user data from database
interface UserFromDb {
  id: string;
  telegramId: bigint;
  username: string | null;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  role: RoleType;
  isActive: boolean;
  isBanned: boolean;
  banReason: string | null;
  balance: Decimal;
  frozenBalance: Decimal;
  totalEarned: Decimal;
  orderLimit: number;
  createLimit: number;
  completedOrders: number;
  cancelledOrders: number;
  averageRating: Decimal;
  totalReviews: number;
  hasActivePlan: boolean;
  planExpiresAt: Date | null;
  referralCode: string | null;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new user
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      const user = await this.prisma.user.create({
        data: {
          telegramId: createUserDto.telegramId,
          username: createUserDto.username,
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          phone: createUserDto.phone,
          email: createUserDto.email,
          role: createUserDto.role || RoleType.CUSTOMER,
          lastSeenAt: new Date(),
        },
      });

      this.logger.log(`New user created: ${user.id} (Telegram: ${createUserDto.telegramId})`);
      return this.formatUserResponse(user);
    } catch (error) {
      this.logger.error('Failed to create user:', (error as Error).message);
      throw new BadRequestException('Failed to create user');
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    return this.formatUserResponse(user);
  }

  /**
   * Find user by Telegram ID
   */
  async findByTelegramId(telegramId: bigint): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      return null;
    }

    return this.formatUserResponse(user);
  }

  /**
   * Find or create user by Telegram data
   */
  async findOrCreateByTelegramData(userData: {
    telegramId: bigint;
    username?: string;
    firstName: string;
    lastName?: string;
    photoUrl?: string;
  }): Promise<UserResponseDto> {
    // Try to find existing user
    let user = await this.prisma.user.findUnique({
      where: { telegramId: userData.telegramId },
    });

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          telegramId: userData.telegramId,
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: RoleType.CUSTOMER,
          lastSeenAt: new Date(),
        },
      });

      this.logger.log(`New user created: ${user.id} (Telegram: ${userData.telegramId})`);
    } else {
      // Update existing user data
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          lastSeenAt: new Date(),
        },
      });
    }

    return this.formatUserResponse(user);
  }

  /**
   * Update user
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          ...updateUserDto,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`User updated: ${user.id}`);
      return this.formatUserResponse(user);
    } catch (error) {
      this.logger.error('Failed to update user:', (error as Error).message);
      throw new BadRequestException('Failed to update user');
    }
  }

  /**
   * Update user's last seen timestamp
   */
  async updateLastSeen(id: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id },
        data: { lastSeenAt: new Date() },
      });
    } catch (error) {
      this.logger.error('Failed to update last seen:', (error as Error).message);
      // Don't throw error for last seen update
    }
  }

  /**
   * Validate user status (active and not banned)
   */
  async validateUserStatus(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        telegramId: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isBanned: true,
        balance: true,
        frozenBalance: true,
        completedOrders: true,
        averageRating: true,
        banReason: true,
        phone: true,
        email: true,
        totalEarned: true,
        orderLimit: true,
        createLimit: true,
        cancelledOrders: true,
        totalReviews: true,
        hasActivePlan: true,
        planExpiresAt: true,
        referralCode: true,
        notificationsEnabled: true,
        emailNotifications: true,
        lastSeenAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActive) {
      throw new BadRequestException('User account is inactive');
    }

    if (user.isBanned) {
      throw new BadRequestException('User account is banned');
    }

    return this.formatUserResponse(user);
  }

  /**
   * Get user for authentication (includes sensitive fields)
   */
  async findForAuth(id: string): Promise<{
    id: string;
    telegramId: bigint;
    username: string | null;
    firstName: string;
    lastName: string | null;
    role: RoleType;
    isActive: boolean;
    isBanned: boolean;
  } | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        telegramId: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isBanned: true,
      },
    });
  }

  /**
   * Ban user
   */
  async banUser(id: string, reason?: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        isBanned: true,
        banReason: reason,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`User banned: ${user.id} - Reason: ${reason || 'No reason provided'}`);
    return this.formatUserResponse(user);
  }

  /**
   * Unban user
   */
  async unbanUser(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        isBanned: false,
        banReason: null,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`User unbanned: ${user.id}`);
    return this.formatUserResponse(user);
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`User account deactivated: ${user.id}`);
    return this.formatUserResponse(user);
  }

  /**
   * Activate user account
   */
  async activateUser(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        isActive: true,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`User account activated: ${user.id}`);
    return this.formatUserResponse(user);
  }

  /**
   * Delete user (soft delete - deactivate)
   */
  async deleteUser(id: string): Promise<{ message: string }> {
    await this.deactivateUser(id);
    return { message: 'User account deactivated successfully' };
  }

  /**
   * Get user statistics
   */
  async getUserStats(id: string): Promise<{
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    averageRating: string;
    totalReviews: number;
    balance: string;
    frozenBalance: string;
    totalEarned: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        completedOrders: true,
        cancelledOrders: true,
        averageRating: true,
        totalReviews: true,
        balance: true,
        frozenBalance: true,
        totalEarned: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      totalOrders: user.completedOrders + user.cancelledOrders,
      completedOrders: user.completedOrders,
      cancelledOrders: user.cancelledOrders,
      averageRating: user.averageRating.toString(),
      totalReviews: user.totalReviews,
      balance: user.balance.toString(),
      frozenBalance: user.frozenBalance.toString(),
      totalEarned: user.totalEarned.toString(),
    };
  }

  /**
   * Format user response
   */
  private formatUserResponse(user: UserFromDb): UserResponseDto {
    return {
      id: user.id,
      telegramId: user.telegramId.toString(),
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isBanned: user.isBanned,
      banReason: user.banReason,
      balance: user.balance.toString(),
      frozenBalance: user.frozenBalance.toString(),
      totalEarned: user.totalEarned.toString(),
      orderLimit: user.orderLimit,
      createLimit: user.createLimit,
      completedOrders: user.completedOrders,
      cancelledOrders: user.cancelledOrders,
      averageRating: user.averageRating.toString(),
      totalReviews: user.totalReviews,
      hasActivePlan: user.hasActivePlan,
      planExpiresAt: user.planExpiresAt,
      referralCode: user.referralCode,
      notificationsEnabled: user.notificationsEnabled,
      emailNotifications: user.emailNotifications,
      lastSeenAt: user.lastSeenAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
