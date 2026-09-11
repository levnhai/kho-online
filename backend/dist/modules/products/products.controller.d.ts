import { ProductsService } from './products.service';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findAll(query: any): Promise<{
        items: (import("mongoose").FlattenMaps<import("./schemas/product.schema").ProductDocument> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findFeatured(limit?: number): Promise<(import("mongoose").FlattenMaps<import("./schemas/product.schema").ProductDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    findBestSellers(limit?: number): Promise<(import("mongoose").FlattenMaps<import("./schemas/product.schema").ProductDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    findNewArrivals(limit?: number): Promise<(import("mongoose").FlattenMaps<import("./schemas/product.schema").ProductDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    findById(id: string): Promise<import("./schemas/product.schema").ProductDocument>;
    create(createDto: any): Promise<import("./schemas/product.schema").ProductDocument>;
    update(id: string, updateDto: any): Promise<import("./schemas/product.schema").ProductDocument>;
    delete(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
