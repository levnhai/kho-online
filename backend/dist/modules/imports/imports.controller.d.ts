import { ImportsService } from './imports.service';
import { CreateImportDto } from './dto/create-import.dto';
export declare class ImportsController {
    private readonly importsService;
    constructor(importsService: ImportsService);
    create(req: any, createImportDto: CreateImportDto): Promise<Omit<import("mongoose").Document<unknown, {}, import("./schemas/import.schema").ImportDocument, {}, {}> & import("./schemas/import.schema").Import & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, never>>;
    findAll(query: any): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("./schemas/import.schema").ImportDocument, {}, {}> & import("./schemas/import.schema").Import & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findById(id: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/import.schema").ImportDocument, {}, {}> & import("./schemas/import.schema").Import & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    update(id: string, updateDto: any): Promise<Omit<import("mongoose").Document<unknown, {}, import("./schemas/import.schema").ImportDocument, {}, {}> & import("./schemas/import.schema").Import & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, never>>;
    updateStatus(id: string, status: string): Promise<Omit<import("mongoose").Document<unknown, {}, import("./schemas/import.schema").ImportDocument, {}, {}> & import("./schemas/import.schema").Import & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, never>>;
    delete(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
