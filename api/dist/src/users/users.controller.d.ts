import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UpdateUserRolesDto, UserResponseDto, UserStatsDto, BalanceUpdateDto, RoleType } from './dto/user.dto';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<UserResponseDto>;
    getProfile(user: AuthenticatedUser): Promise<UserResponseDto>;
    updateProfile(user: AuthenticatedUser, updateUserDto: UpdateUserDto): Promise<UserResponseDto>;
    getMyStats(user: AuthenticatedUser): Promise<UserStatsDto>;
    addBalance(user: AuthenticatedUser, balanceDto: BalanceUpdateDto): Promise<{
        message: string;
        newBalance: number;
    }>;
    addPerformerRole(user: AuthenticatedUser): Promise<UserResponseDto>;
    findAll(role?: RoleType, page?: number, limit?: number): Promise<{
        users: UserResponseDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: number): Promise<UserResponseDto>;
    update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto>;
    updateRoles(id: number, updateRolesDto: UpdateUserRolesDto): Promise<UserResponseDto>;
    blockUser(id: number, body: {
        reason?: string;
    }): Promise<{
        message: string;
    }>;
    unblockUser(id: number): Promise<{
        message: string;
    }>;
    getUserStats(id: number): Promise<UserStatsDto>;
    updateUserBalance(id: number, balanceDto: BalanceUpdateDto): Promise<{
        message: string;
        newBalance: number;
    }>;
    findByRefCode(refCode: string): Promise<{
        id: number;
        firstName: string;
        lastName?: string;
        username?: string;
        refCode: string;
    }>;
}
