import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    register(registerDto: any): Promise<{
        user: {
            _id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            phone: string;
            role: import("../users/schemas/user.schema").UserRole;
            address: string;
        };
        token: string;
    }>;
    login(loginDto: any): Promise<{
        user: {
            _id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            phone: string;
            role: import("../users/schemas/user.schema").UserRole;
            address: string;
        };
        token: string;
    }>;
    private generateToken;
}
