import { Model } from 'mongoose';
import { UserDocument } from './schemas/user.schema';
export declare class UsersService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    create(createUserDto: any): Promise<UserDocument>;
    findByEmail(email: string): Promise<UserDocument | null>;
    findById(id: string): Promise<UserDocument | null>;
    findAll(search?: string): Promise<any[]>;
    update(id: string, updateData: any): Promise<UserDocument>;
    countCustomers(): Promise<number>;
}
