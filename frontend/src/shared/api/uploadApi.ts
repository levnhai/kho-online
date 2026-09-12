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

    const response = await api.post<UploadSingleResponse>('/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      skipCache: true,
    });

    return response.data;
  },

  /**
   * Upload nhiều tệp hình ảnh cùng lúc (tối đa 10 ảnh)
   */
  uploadMultiple: async (files: File[]): Promise<UploadMultipleResponse> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.post<UploadMultipleResponse>('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      skipCache: true,
    });

    return response.data;
  },
};
