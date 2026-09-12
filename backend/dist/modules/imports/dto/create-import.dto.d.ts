export declare class CreateImportItemDto {
    product?: string;
    productCode?: string;
    productName?: string;
    productImage?: string;
    size?: string;
    quantity: number;
    importPrice: number;
}
export declare class CreateImportDto {
    orderName: string;
    productCode?: string;
    image?: string;
    quantity?: number;
    totalAmount?: number;
    supplier?: string;
    note?: string;
    status?: string;
    productId?: string;
    size?: string;
    items?: CreateImportItemDto[];
}
