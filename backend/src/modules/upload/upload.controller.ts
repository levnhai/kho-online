import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService, UploadFile } from './upload.service';

// Cấu hình Multer Memory Storage để stream trực tiếp lên Cloudinary
export const multerMemoryStorageOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max
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

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Upload 1 hình ảnh lên Cloudinary
   * POST /api/upload/single
   */
  @Post('single')
  @UseInterceptors(FileInterceptor('file', multerMemoryStorageOptions))
  async uploadSingle(@UploadedFile() file: UploadFile) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn một tệp hình ảnh để tải lên');
    }
    return this.uploadService.processSingleFile(file);
  }

  /**
   * Upload nhiều hình ảnh cùng lúc (tối đa 10 ảnh) lên Cloudinary
   * POST /api/upload/multiple
   */
  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10, multerMemoryStorageOptions))
  async uploadMultiple(@UploadedFiles() files: UploadFile[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một tệp hình ảnh để tải lên');
    }
    return this.uploadService.processMultipleFiles(files);
  }
}
