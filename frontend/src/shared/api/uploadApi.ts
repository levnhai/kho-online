import api from './base';

export interface UploadSingleResponse {
  success: boolean;
  url: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
}

export interface UploadMultipleResponse {
  success: boolean;
  count: number;
  urls: string[];
  files: UploadSingleResponse[];
}

export const uploadApi = {
  /**
   * Upload 1 tệp hình ảnh
   */
  uploadSingle: async (file: File): Promise<UploadSingleResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response: any = await api.post('/upload/single', formData, {
      headers: {
        'Content-Type': undefined,
      },
      skipCache: true,
    });

    return response?.data || response;
  },

  /**
   * Upload nhiều tệp hình ảnh cùng lúc (tối đa 10 ảnh)
   */
  uploadMultiple: async (files: File[]): Promise<UploadMultipleResponse> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response: any = await api.post('/upload/multiple', formData, {
      headers: {
        'Content-Type': undefined,
      },
      skipCache: true,
    });

    return response?.data || response;
  },
};
