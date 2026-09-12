import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Import, ImportDocument } from './schemas/import.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { CreateImportDto } from './dto/create-import.dto';

@Injectable()
export class ImportsService {
  constructor(
    @InjectModel(Import.name) private importModel: Model<ImportDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(userId: string, createImportDto: CreateImportDto) {
    const { orderName, productCode, image, supplier, items, note, quantity, totalAmount, productId, size } =
      createImportDto;

    let formattedItems: any[] = [];
    let finalTotalQuantity = 0;
    let finalTotalAmount = 0;
    let finalImage = image?.trim() || '';
    let finalOrderName = orderName?.trim() || '';
    let finalProductCode = productCode?.trim().toUpperCase() || `SP${Math.floor(1000 + Math.random() * 9000)}`;

    // Trường hợp 1: Có mảng items
    if (items && items.length > 0) {
      for (const item of items) {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.importPrice) || 0;
        const lineTotal = qty * price;
        finalTotalQuantity += qty;
        finalTotalAmount += lineTotal;

        let prodDoc: any = null;
        if (item.product) {
          prodDoc = await this.productModel.findById(item.product);
        } else if (item.productCode) {
          prodDoc = await this.productModel.findOne({ code: item.productCode.toUpperCase() });
        }

        if (prodDoc) {
          prodDoc.stock = (prodDoc.stock || 0) + qty;
          if (item.size && prodDoc.sizes && prodDoc.sizes.length > 0) {
            const sIdx = prodDoc.sizes.findIndex(
              (s: any) => s.name.trim().toLowerCase() === item.size.trim().toLowerCase()
            );
            if (sIdx !== -1) {
              prodDoc.sizes[sIdx].stock = (prodDoc.sizes[sIdx].stock || 0) + qty;
            } else {
              prodDoc.sizes.push({
                name: item.size.trim(),
                price: prodDoc.price,
                salePrice: prodDoc.salePrice || 0,
                stock: qty,
                sku: `${prodDoc.code}-${item.size.trim().toUpperCase()}`,
              });
            }
          }
          await prodDoc.save();
        }

        const pImg = item.productImage || prodDoc?.images?.[0] || '';
        if (!finalImage && pImg) finalImage = pImg;

        formattedItems.push({
          product: prodDoc?._id || item.product || null,
          productCode: item.productCode || prodDoc?.code || finalProductCode,
          productName: item.productName || prodDoc?.name || 'Sản phẩm',
          productImage: pImg,
          size: item.size || '',
          quantity: qty,
          importPrice: price,
          total: lineTotal,
        });
      }
    } else {
      // Trường hợp 2: Nhập trực tiếp đơn hàng (Tên đơn hàng, Mã sản phẩm, Hình ảnh, Số lượng, Tổng tiền nhập)
      const qty = Number(quantity) || 1;
      const total = Number(totalAmount) || 0;
      const unitPrice = qty > 0 ? Math.round(total / qty) : total;
      finalTotalQuantity = qty;
      finalTotalAmount = total;

      let prodDoc: any = null;
      if (productId) {
        prodDoc = await this.productModel.findById(productId);
      } else if (finalProductCode) {
        prodDoc = await this.productModel.findOne({ code: finalProductCode });
      }

      if (prodDoc) {
        prodDoc.stock = (prodDoc.stock || 0) + qty;
        if (size && prodDoc.sizes && prodDoc.sizes.length > 0) {
          const sIdx = prodDoc.sizes.findIndex(
            (s: any) => s.name.trim().toLowerCase() === size.trim().toLowerCase()
          );
          if (sIdx !== -1) {
            prodDoc.sizes[sIdx].stock = (prodDoc.sizes[sIdx].stock || 0) + qty;
          }
        }
        await prodDoc.save();
        if (!finalImage && prodDoc.images?.[0]) {
          finalImage = prodDoc.images[0];
        }
      }

      if (!finalOrderName) {
        finalOrderName = prodDoc?.name || 'Đơn hàng nhập';
      }

      formattedItems.push({
        product: prodDoc?._id || null,
        productCode: finalProductCode,
        productName: finalOrderName,
        productImage: finalImage,
        size: size || '',
        quantity: qty,
        importPrice: unitPrice,
        total: total,
      });
    }

    if (!finalOrderName) {
      finalOrderName = formattedItems[0]?.productName || 'Đơn nhập hàng';
    }

    // Sinh mã phiếu nhập: PN + YYMMDD + 4 số ngẫu nhiên
    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const importCode = `PN${dateStr}-${randomSuffix}`;

    const newImport = new this.importModel({
      importCode,
      orderName: finalOrderName,
      productCode: finalProductCode,
      image: finalImage,
      supplier: (supplier || 'Nhà cung cấp').trim(),
      items: formattedItems,
      totalQuantity: finalTotalQuantity,
      totalAmount: finalTotalAmount,
      note: note ? note.trim() : '',
      status: createImportDto.status || 'ORDERED',
      createdBy: userId,
    });

    return (await newImport.save()).populate('createdBy', 'name email');
  }

  async findAll(query: any = {}) {
    const { search, status, page = 1, limit = 50 } = query;
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { importCode: { $regex: search, $options: 'i' } },
        { orderName: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } },
        { note: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      this.importModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('createdBy', 'name email')
        .populate('items.product', 'name code image price stock')
        .exec(),
      this.importModel.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }

  async findById(id: string) {
    const record = await this.importModel
      .findById(id)
      .populate('createdBy', 'name email')
      .populate('items.product', 'name code image price stock')
      .exec();

    if (!record) {
      throw new NotFoundException('Không tìm thấy phiếu nhập hàng');
    }

    return record;
  }

  async delete(id: string) {
    const record = await this.importModel.findById(id);
    if (!record) {
      throw new NotFoundException('Không tìm thấy phiếu nhập hàng');
    }

    // Hoàn tác trừ tồn kho nếu phiếu đang COMPLETED
    if (record.status === 'COMPLETED') {
      for (const item of record.items) {
        const product = await this.productModel.findById(item.product);
        if (product) {
          product.stock = Math.max(0, (product.stock || 0) - item.quantity);

          if (item.size && product.sizes && product.sizes.length > 0) {
            const sizeIndex = product.sizes.findIndex((s) => s.name.trim().toLowerCase() === item.size.trim().toLowerCase());
            if (sizeIndex !== -1) {
              product.sizes[sizeIndex].stock = Math.max(0, (product.sizes[sizeIndex].stock || 0) - item.quantity);
            }
          }

          await product.save();
        }
      }
    }

    await this.importModel.findByIdAndDelete(id);
    return { success: true, message: 'Đã hủy và xóa phiếu nhập hàng thành công' };
  }

  async update(id: string, updateDto: any) {
    const record = await this.importModel.findById(id);
    if (!record) {
      throw new NotFoundException('Không tìm thấy phiếu nhập hàng');
    }

    const { orderName, productCode, image, supplier, note, quantity, totalAmount } = updateDto;

    // Cập nhật tồn kho nếu số lượng thay đổi
    if (quantity !== undefined) {
      const newQty = Number(quantity);
      const oldQty = Number(record.totalQuantity) || 0;
      const delta = newQty - oldQty;

      if (delta !== 0 && record.status === 'COMPLETED') {
        const pCode = productCode?.trim() || record.productCode;
        if (pCode) {
          const product = await this.productModel.findOne({ code: pCode.toUpperCase() });
          if (product) {
            product.stock = Math.max(0, (product.stock || 0) + delta);
            await product.save();
          }
        }
      }

      record.totalQuantity = newQty;
    }

    if (totalAmount !== undefined) {
      record.totalAmount = Number(totalAmount);
    }

    if (orderName !== undefined) record.orderName = orderName.trim();
    if (productCode !== undefined) record.productCode = productCode.trim().toUpperCase();
    if (image !== undefined) record.image = image.trim();
    if (supplier !== undefined) record.supplier = supplier.trim();
    if (note !== undefined) record.note = note.trim();
    if (updateDto.status !== undefined) record.status = updateDto.status;

    // Đồng bộ item đầu tiên nếu có
    if (record.items && record.items.length > 0) {
      if (orderName !== undefined) record.items[0].productName = orderName.trim();
      if (productCode !== undefined) record.items[0].productCode = productCode.trim().toUpperCase();
      if (image !== undefined) record.items[0].productImage = image.trim();
      if (quantity !== undefined) record.items[0].quantity = Number(quantity);
      if (totalAmount !== undefined) {
        record.items[0].total = Number(totalAmount);
        record.items[0].importPrice =
          record.items[0].quantity > 0
            ? Math.round(Number(totalAmount) / record.items[0].quantity)
            : Number(totalAmount);
      }
    }

    await record.save();
    return record.populate('createdBy', 'name email');
  }

  async updateStatus(id: string, status: string) {
    const record = await this.importModel.findById(id);
    if (!record) {
      throw new NotFoundException('Không tìm thấy phiếu nhập hàng');
    }
    record.status = status;
    await record.save();
    return record.populate('createdBy', 'name email');
  }
}
