import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto';
import { UserService } from './user.service';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    create(createUserDto: CreateUserDto): Promise<UserResponseDto>;
    getMe(userId: string): Promise<UserResponseDto>;
    getMyStats(userId: string): Promise<{
        totalOrders: number;
        completedOrders: number;
        cancelledOrders: number;
        averageRating: string;
        totalReviews: number;
        balance: string;
        frozenBalance: string;
        totalEarned: string;
    }>;
    updateMe(userId: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto>;
    deleteMe(userId: string): Promise<{
        message: string;
    }>;
    findOne(id: string): Promise<UserResponseDto>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto>;
    banUser(id: string, body: {
        reason?: string;
    }): Promise<UserResponseDto>;
    unbanUser(id: string): Promise<UserResponseDto>;
    deactivateUser(id: string): Promise<UserResponseDto>;
    activateUser(id: string): Promise<UserResponseDto>;
    remove(id: string): Promise<{
        message: string;
    }>;
    getUserStats(id: string): Promise<{
        totalOrders: number;
        completedOrders: number;
        cancelledOrders: number;
        averageRating: string;
        totalReviews: number;
        balance: string;
        frozenBalance: string;
        totalEarned: string;
    }>;
}
