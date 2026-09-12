import { Document, Schema as MongooseSchema } from 'mongoose';
export type ImportDocument = Import & Document;
export declare class ImportItem {
    product?: string;
    productCode?: string;
    productName: string;
    productImage?: string;
    size?: string;
    quantity: number;
    importPrice: number;
    total: number;
}
export declare class Import {
    importCode: string;
    orderName?: string;
    productCode?: string;
    image?: string;
    supplier: string;
    items: ImportItem[];
    totalQuantity: number;
    totalAmount: number;
    note?: string;
    status: string;
    createdBy: any;
}
export declare const ImportSchema: MongooseSchema<Import, import("mongoose").Model<Import, any, any, any, Document<unknown, any, Import, any, {}> & Import & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Import, Document<unknown, {}, import("mongoose").FlatRecord<Import>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Import> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
