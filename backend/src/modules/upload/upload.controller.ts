import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { UploadService } from './upload.service';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'products');

// Đảm bảo thư mục lưu trữ luôn tồn tại
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Cấu hình Multer Storage
export const multerStorageOptions = {
  storage: diskStorage({
    destination: (req, file, callback) => {
      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }
      callback(null, UPLOAD_DIR);
    },
    filename: (req, file, callback) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.png';
      const cleanName = path
        .basename(file.originalname, ext)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 30);
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
      callback(null, `${cleanName}-${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req: any, file: any, callback: any) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new BadRequestException(
          'Định dạng tệp không hợp lệ. Chỉ chấp nhận các định dạng ảnh (.jpg, .jpeg, .png, .webp, .gif, .svg)',
        ),
        false,
      );
    }
  },
};

export interface UploadFile {
  fieldname?: string;
  originalname: string;
  encoding?: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename: string;
  path?: string;
  buffer?: Buffer;
}

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Upload 1 hình ảnh
   * POST /api/upload/single
   */
  @Post('single')
  @UseInterceptors(FileInterceptor('file', multerStorageOptions))
  uploadSingle(@UploadedFile() file: UploadFile, @Req() req: any) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn một tệp hình ảnh để tải lên');
    }
    return this.uploadService.formatFileResponse(file, req);
  }

  /**
   * Upload nhiều hình ảnh cùng lúc (tối đa 10 ảnh)
   * POST /api/upload/multiple
   */
  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10, multerStorageOptions))
  uploadMultiple(@UploadedFiles() files: UploadFile[], @Req() req: any) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một tệp hình ảnh để tải lên');
    }
    return this.uploadService.formatMultipleFilesResponse(files, req);
  }
}
