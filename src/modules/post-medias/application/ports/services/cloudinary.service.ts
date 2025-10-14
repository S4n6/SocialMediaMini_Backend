export interface UploadedFile {
  url: string;
  type: string;
  resourceType: string;
}

export interface CloudinaryService {
  uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string,
  ): Promise<UploadedFile[]>;

  generateSignature(params: any): Promise<string>;
}
