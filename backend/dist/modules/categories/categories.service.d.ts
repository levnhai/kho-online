import { Model } from 'mongoose';
import { CategoryDocument } from './schemas/category.schema';
import { ProductDocument } from '../products/schemas/product.schema';
export declare class CategoriesService {
    private categoryModel;
    private productModel;
    constructor(categoryModel: Model<CategoryDocument>, productModel: Model<ProductDocument>);
    findAll(): Promise<any[]>;
    findById(id: string): Promise<CategoryDocument>;
    create(createDto: any): Promise<CategoryDocument>;
    update(id: string, updateDto: any): Promise<CategoryDocument>;
    delete(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
