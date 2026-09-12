import { Injectable, BadRequestException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

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

@Injectable()
export class UploadService {
  /**
   * Format uploaded file to return a friendly URL and metadata
   */
  formatFileResponse(file: UploadFile, req?: any) {
    if (!file) {
      throw new BadRequestException('Không tìm thấy tệp tải lên');
    }

    // Relative public URL path
    const relativeUrl = `/uploads/products/${file.filename}`;

    return {
      success: true,
      url: relativeUrl,
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  /**
   * Format multiple uploaded files
   */
  formatMultipleFilesResponse(files: UploadFile[], req?: any) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Chưa chọn tệp ảnh nào để tải lên');
    }

    const uploadedFiles = files.map((file) => this.formatFileResponse(file, req));
    const urls = uploadedFiles.map((f) => f.url);

    return {
      success: true,
      count: uploadedFiles.length,
      urls,
      files: uploadedFiles,
    };
  }
}
