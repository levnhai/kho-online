import { Model } from 'mongoose';
import { ProductDocument } from './schemas/product.schema';
export declare class ProductsService {
    private productModel;
    constructor(productModel: Model<ProductDocument>);
    findAll(query?: any): Promise<{
        items: (import("mongoose").FlattenMaps<ProductDocument> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findFeatured(limit?: number): Promise<(import("mongoose").FlattenMaps<ProductDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    findBestSellers(limit?: number): Promise<(import("mongoose").FlattenMaps<ProductDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    findNewArrivals(limit?: number): Promise<(import("mongoose").FlattenMaps<ProductDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    findById(id: string): Promise<ProductDocument>;
    create(createDto: any): Promise<ProductDocument>;
    update(id: string, updateDto: any): Promise<ProductDocument>;
    delete(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    countAll(): Promise<number>;
}
