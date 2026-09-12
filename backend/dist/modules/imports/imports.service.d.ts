import { Model } from 'mongoose';
import { Import, ImportDocument } from './schemas/import.schema';
import { ProductDocument } from '../products/schemas/product.schema';
import { CreateImportDto } from './dto/create-import.dto';
export declare class ImportsService {
    private importModel;
    private productModel;
    constructor(importModel: Model<ImportDocument>, productModel: Model<ProductDocument>);
    create(userId: string, createImportDto: CreateImportDto): Promise<Omit<import("mongoose").Document<unknown, {}, ImportDocument, {}, {}> & Import & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, never>>;
    findAll(query?: any): Promise<{
        items: (import("mongoose").Document<unknown, {}, ImportDocument, {}, {}> & Import & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findById(id: string): Promise<import("mongoose").Document<unknown, {}, ImportDocument, {}, {}> & Import & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    delete(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    update(id: string, updateDto: any): Promise<Omit<import("mongoose").Document<unknown, {}, ImportDocument, {}, {}> & Import & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, never>>;
    updateStatus(id: string, status: string): Promise<Omit<import("mongoose").Document<unknown, {}, ImportDocument, {}, {}> & Import & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, never>>;
}
