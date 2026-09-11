import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<import("./schemas/user.schema").UserDocument>;
    updateProfile(req: any, updateDto: any): Promise<import("./schemas/user.schema").UserDocument>;
    getCustomers(search?: string): Promise<any[]>;
    updateUserStatus(id: string, status: string): Promise<import("./schemas/user.schema").UserDocument>;
}
