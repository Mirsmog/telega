import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ParseIntPipe, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger'
import { UsersService } from './users.service'
import { CreateUserDto, UpdateUserDto, UpdateUserRolesDto, UserResponseDto, UserStatsDto, BalanceUpdateDto, RoleType } from './dto/user.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Roles } from '../auth/decorators/roles.decorator'
import { AuthenticatedUser } from '../auth/interfaces/auth.interface'

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully', type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return await this.usersService.create(createUserDto)
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile', type: UserResponseDto })
  async getProfile(@CurrentUser() user: AuthenticatedUser): Promise<UserResponseDto> {
    const fullUser = await this.usersService.findById(user.id)
    if (!fullUser) {
      throw new Error('User not found')
    }
    return this.usersService.mapToResponseDto(fullUser)
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully', type: UserResponseDto })
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserResponseDto> {
    return await this.usersService.update(user.id, updateUserDto)
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get current user statistics' })
  @ApiResponse({ status: 200, description: 'User statistics', type: UserStatsDto })
  async getMyStats(@CurrentUser() user: AuthenticatedUser): Promise<UserStatsDto> {
    return this.usersService.getUserStats(user.id)
  }

  @Post('me/balance')
  @ApiOperation({ summary: 'Add balance to current user account' })
  @ApiResponse({ status: 200, description: 'Balance updated successfully' })
  async addBalance(
    @CurrentUser() user: AuthenticatedUser,
    @Body() balanceDto: BalanceUpdateDto
  ): Promise<{ message: string; newBalance: number }> {
    await this.usersService.addBalance(user.id, balanceDto.type, balanceDto.amount)
    const stats = await this.usersService.getUserStats(user.id)
    
    let newBalance: number
    switch (balanceDto.type) {
      case 'customer':
        newBalance = stats.customerBalance
        break
      case 'performer':
        newBalance = stats.performerBalance
        break
      case 'referral':
        newBalance = stats.refBalance
        break
    }

    return {
      message: `${balanceDto.type} balance updated successfully`,
      newBalance
    }
  }

  @Post('me/roles')
  @UseGuards(RolesGuard)
  @Roles('CUSTOMER', 'PERFORMER')
  @ApiOperation({ summary: 'Add performer role to current user' })
  @ApiResponse({ status: 200, description: 'Role added successfully' })
  async addPerformerRole(@CurrentUser() user: AuthenticatedUser): Promise<UserResponseDto> {
    const currentRoles = user.roles as string[]
    if (!currentRoles.includes('PERFORMER')) {
      const newRoles = [...currentRoles, 'PERFORMER'] as RoleType[]
      return await this.usersService.updateRoles(user.id, newRoles)
    }
    
    // Return current user if already has performer role
    const fullUser = await this.usersService.findById(user.id)
    return this.usersService.mapToResponseDto(fullUser!)
  }

  // Admin endpoints
  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiQuery({ name: 'role', required: false, enum: RoleType, description: 'Filter by role' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'List of users', type: [UserResponseDto] })
  async findAll(
    @Query('role') role?: RoleType,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{
    users: UserResponseDto[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    if (role) {
      const users = await this.usersService.getUsersByRole(role)
      return {
        users: users,
        total: users.length,
        page: 1,
        limit: users.length,
        totalPages: 1
      }
    }

    // For now, return simple implementation
    // In production, you'd implement proper pagination
    const users = await this.usersService.getUsersByRole(RoleType.CUSTOMER)
    const performers = await this.usersService.getUsersByRole(RoleType.PERFORMER)
    const allUsers = [...users, ...performers]

    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedUsers = allUsers.slice(startIndex, endIndex)

    return {
      users: paginatedUsers,
      total: allUsers.length,
      page,
      limit,
      totalPages: Math.ceil(allUsers.length / limit)
    }
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User found', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    const user = await this.usersService.findById(id)
    if (!user) {
      throw new Error('User not found')
    }
    return this.usersService.mapToResponseDto(user)
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update user by ID (Admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserResponseDto> {
    return await this.usersService.update(id, updateUserDto)
  }

  @Put(':id/roles')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update user roles (Admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User roles updated successfully', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRolesDto: UpdateUserRolesDto
  ): Promise<UserResponseDto> {
    return await this.usersService.updateRoles(id, updateRolesDto.roles)
  }

  @Post(':id/block')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Block user (Admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User blocked successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async blockUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason?: string }
  ): Promise<{ message: string }> {
    await this.usersService.blockUser(id, body.reason)
    return { message: 'User blocked successfully' }
  }

  @Post(':id/unblock')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Unblock user (Admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User unblocked successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async unblockUser(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.usersService.unblockUser(id)
    return { message: 'User unblocked successfully' }
  }

  @Get(':id/stats')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get user statistics (Admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User statistics', type: UserStatsDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserStats(@Param('id', ParseIntPipe) id: number): Promise<UserStatsDto> {
    return this.usersService.getUserStats(id)
  }

  @Post(':id/balance')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update user balance (Admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Balance updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserBalance(
    @Param('id', ParseIntPipe) id: number,
    @Body() balanceDto: BalanceUpdateDto
  ): Promise<{ message: string; newBalance: number }> {
    await this.usersService.addBalance(id, balanceDto.type, balanceDto.amount)
    const stats = await this.usersService.getUserStats(id)
    
    let newBalance: number
    switch (balanceDto.type) {
      case 'customer':
        newBalance = stats.customerBalance
        break
      case 'performer':
        newBalance = stats.performerBalance
        break
      case 'referral':
        newBalance = stats.refBalance
        break
    }

    return {
      message: `User ${balanceDto.type} balance updated successfully`,
      newBalance
    }
  }

  @Get('referral/:refCode')
  @ApiOperation({ summary: 'Get user by referral code' })
  @ApiParam({ name: 'refCode', type: String, description: 'Referral code' })
  @ApiResponse({ status: 200, description: 'User found by referral code' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findByRefCode(@Param('refCode') refCode: string): Promise<{
    id: number
    firstName: string
    lastName?: string
    username?: string
    refCode: string
  }> {
    const user = await this.usersService.findByRefCode(refCode)
    if (!user) {
      throw new Error('User not found')
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      refCode: user.refCode!
    }
  }
} 