import { CategoriesService } from './categories.service';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    findAll(): Promise<any[]>;
    findById(id: string): Promise<import("./schemas/category.schema").CategoryDocument>;
    create(createDto: any): Promise<import("./schemas/category.schema").CategoryDocument>;
    update(id: string, updateDto: any): Promise<import("./schemas/category.schema").CategoryDocument>;
    delete(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
