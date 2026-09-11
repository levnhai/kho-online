import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
    getProfile(req: any): any;
}
