import { AbstractFileProviderService } from "@medusajs/framework/utils";
import {
  ProviderDeleteFileDTO,
  ProviderGetFileDTO,
  ProviderUploadFileDTO,
} from "@medusajs/framework/types";
import { Client } from "@replit/object-storage";
import { MedusaError } from "@medusajs/framework/utils";
const fs = require("fs");

type ReplitFileServiceOptions = {
  bucket_id?: string;
  backend_url?: string;
};

export class ReplitFileService extends AbstractFileProviderService {
  static identifier = "replit-file";
  protected client_: Client;
  protected bucketId_: string;
  protected backendUrl_: string;

  constructor(container: any, options: ReplitFileServiceOptions) {
    super();
    this.bucketId_ = options.bucket_id || process.env.REPLIT_BUCKET_ID || "";
    this.backendUrl_ =
      options.backend_url ||
      process.env.MEDUSA_BACKEND_URL ||
      "http://localhost:9000";
    this.client_ = new Client();
  }

  async upload(
    file: ProviderUploadFileDTO,
  ): Promise<{ url: string; key: string }> {
    if (!file) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "No file provided");
    }

    let content: Buffer;
    if (Buffer.isBuffer(file.content)) {
      content = file.content;
    } else {
      content = Buffer.from(file.content as any);
    }

    const key = file.filename;

    const result = await this.client_.uploadFromBytes(key, content) as any;
    const ok = result?.ok;
    const error = result?.error;

    if (!ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to upload to Replit Storage: ${error}`,
      );
    }

    const url = `${this.backendUrl_}/store/file-replit/download?key=${encodeURIComponent(key)}`;

    return {
      url,
      key,
    };
  }

  async delete(file: ProviderDeleteFileDTO): Promise<void> {
    const result = await this.client_.delete(file.fileKey) as any;
    if (!result?.ok) {
      console.error(
        `Failed to delete file ${file.fileKey} from Replit Storage: ${result?.error}`,
      );
    }
  }

  async getPresignedDownloadUrl(fileData: ProviderGetFileDTO): Promise<string> {
    return `${this.backendUrl_}/store/file-replit/download?key=${encodeURIComponent(fileData.fileKey)}`;
  }
}
