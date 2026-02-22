import { AbstractFileProviderService } from "@medusajs/framework/utils";
import {
  ProviderDeleteFileDTO,
  ProviderGetFileDTO,
  ProviderUploadFileDTO,
} from "@medusajs/framework/types";
import { put, del } from "@vercel/blob";
import { MedusaError } from "@medusajs/framework/utils";

type VercelBlobFileServiceOptions = {
  token?: string;
  access?: "public" | "private";
};

export class VercelBlobFileService extends AbstractFileProviderService {
  static identifier = "vercel-blob";
  protected token_: string;
  protected access_: "public" | "private";

  constructor(container: any, options: VercelBlobFileServiceOptions) {
    super();
    this.token_ =
      options.token || process.env.BLOB_READ_WRITE_TOKEN || "";
    this.access_ = options.access || "public";
  }

  async upload(
    file: ProviderUploadFileDTO,
  ): Promise<{ url: string; key: string }> {
    if (!file) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "No file provided",
      );
    }

    let content: Buffer;
    if (Buffer.isBuffer(file.content)) {
      content = file.content;
    } else {
      content = Buffer.from(file.content as any);
    }

    const blob = await put(file.filename, content, {
      access: this.access_,
      addRandomSuffix: false,
      token: this.token_,
    });

    return {
      url: blob.url,
      key: blob.pathname,
    };
  }

  async delete(file: ProviderDeleteFileDTO): Promise<void> {
    try {
      const urlToDelete = file.fileKey.startsWith("http")
        ? file.fileKey
        : file.fileKey;
      await del(urlToDelete, { token: this.token_ });
    } catch (error: any) {
      console.error(
        `Failed to delete file ${file.fileKey} from Vercel Blob: ${error.message}`,
      );
    }
  }

  async getPresignedDownloadUrl(
    fileData: ProviderGetFileDTO,
  ): Promise<string> {
    if (fileData.fileKey.startsWith("http")) {
      return fileData.fileKey;
    }
    return `https://${fileData.fileKey}`;
  }
}
