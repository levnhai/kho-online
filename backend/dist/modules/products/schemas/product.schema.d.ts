import { Document, Schema as MongooseSchema } from 'mongoose';
import { Category } from '../../categories/schemas/category.schema';
export type ProductDocument = Product & Document;
export declare class Product {
    name: string;
    code: string;
    category: Category;
    price: number;
    salePrice: number;
    stock: number;
    images: string[];
    description: string;
    specifications: Record<string, string>;
    soldCount: number;
    rating: number;
    isFeatured: boolean;
    status: string;
}
export declare const ProductSchema: MongooseSchema<Product, import("mongoose").Model<Product, any, any, any, Document<unknown, any, Product, any, {}> & Product & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Product, Document<unknown, {}, import("mongoose").FlatRecord<Product>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Product> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
