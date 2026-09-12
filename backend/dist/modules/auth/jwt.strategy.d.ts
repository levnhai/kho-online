import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private usersService;
    private configService;
    constructor(usersService: UsersService, configService: ConfigService);
    validate(payload: any): Promise<{
        _id: import("mongoose").Types.ObjectId;
        name: string;
        email: string;
        phone: string;
        role: import("../users/schemas/user.schema").UserRole;
        address: string;
    }>;
}
export {};
