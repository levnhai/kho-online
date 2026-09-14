import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as streamifier from 'streamifier';
import { cloudinary, configureCloudinary, isCloudinaryConfigured } from '../../config/cloudinary.config';

export interface UploadFile {
  fieldname?: string;
  originalname: string;
  encoding?: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer?: Buffer;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private isCloudinaryReady = false;

  constructor() {
    this.isCloudinaryReady = configureCloudinary();
    if (this.isCloudinaryReady) {
      this.logger.log('✅ Cloudinary Storage đã sẵn sàng hoạt động.');
    } else {
      this.logger.warn(
        '⚠️ Chưa cấu hình đầy đủ biến môi trường Cloudinary. Hệ thống đang sử dụng chế độ lưu cục bộ (Local Storage Fallback).',
      );
    }
  }

  /**
   * Upload buffer lên Cloudinary
   */
  async uploadToCloudinary(file: UploadFile): Promise<{ url: string; publicId: string }> {
    if (!file.buffer) {
      throw new BadRequestException('Không tìm thấy dữ liệu tệp hình ảnh để tải lên');
    }

    const cleanName = path
      .basename(file.originalname, path.extname(file.originalname))
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 40);

    const publicId = `${cleanName}-${Date.now()}`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'kho-online/products',
          public_id: publicId,
          resource_type: 'image',
          transformation: [
            { quality: 'auto', fetch_format: 'auto' }, // Tự động nén WebP tối ưu dung lượng
          ],
        },
        (error, result) => {
          if (error) {
            this.logger.error('Lỗi khi tải ảnh lên Cloudinary:', error);
            return reject(error);
          }
          if (!result) {
            return reject(new Error('Không nhận được phản hồi từ Cloudinary'));
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  /**
   * Lưu ảnh vào ổ cứng cục bộ (Fallback khi chưa cấu hình Cloudinary)
   */
  async saveToLocalStorage(file: UploadFile): Promise<string> {
    const uploadDir = path.join(process.cwd(), 'uploads', 'products');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const cleanName = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 30);
    const filename = `${cleanName}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    const filePath = path.join(uploadDir, filename);

    if (file.buffer) {
      await fs.promises.writeFile(filePath, file.buffer);
    }

    return `/uploads/products/${filename}`;
  }

  /**
   * Xử lý tải lên 1 tệp hình ảnh
   */
  async processSingleFile(file: UploadFile): Promise<any> {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn một tệp hình ảnh để tải lên');
    }

    // Tự động kiểm tra lại cấu hình Cloudinary (nếu biến môi trường được nạp sau)
    if (!this.isCloudinaryReady && isCloudinaryConfigured()) {
      this.isCloudinaryReady = configureCloudinary();
    }

    try {
      if (this.isCloudinaryReady && file.buffer) {
        const result = await this.uploadToCloudinary(file);
        return {
          success: true,
          provider: 'cloudinary',
          url: result.url,
          publicId: result.publicId,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        };
      }
    } catch (err) {
      this.logger.error('Lỗi khi upload Cloudinary, tự động chuyển sang lưu cục bộ:', err);
    }

    // Fallback: Lưu vào thư mục uploads cục bộ
    const localUrl = await this.saveToLocalStorage(file);
    return {
      success: true,
      provider: 'local',
      url: localUrl,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  /**
   * Xử lý tải lên nhiều tệp hình ảnh cùng lúc
   */
  async processMultipleFiles(files: UploadFile[]): Promise<any> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Chưa chọn tệp ảnh nào để tải lên');
    }

    const uploadPromises = files.map((file) => this.processSingleFile(file));
    const results = await Promise.all(uploadPromises);
    const urls = results.map((r) => r.url);

    return {
      success: true,
      count: results.length,
      urls,
      files: results,
    };
  }
}
