import { AbstractFileProviderService } from "@medusajs/framework/utils";
import {
  ProviderDeleteFileDTO,
  ProviderGetFileDTO,
  ProviderUploadFileDTO,
} from "@medusajs/framework/types";
import { put, del } from "@vercel/blob";
import { MedusaError } from "@medusajs/framework/utils";
import {
  buildTenantPath,
  MEDUSA_PRODUCT_PREFIX,
  MEDUSA_CATALOG_PREFIX,
} from "../../lib/storage/prefixRegistry";

type VercelBlobFileServiceOptions = {
  token?: string;
  access?: "public" | "private";
  defaultTenantSlug?: string;
};

export class VercelBlobFileService extends AbstractFileProviderService {
  static identifier = "vercel-blob";
  protected token_: string;
  protected access_: "public" | "private";
  protected defaultTenantSlug_: string;

  constructor(container: any, options: VercelBlobFileServiceOptions) {
    super();
    this.token_ =
      options.token || process.env.BLOB_READ_WRITE_TOKEN || "";
    this.access_ = options.access || "public";
    this.defaultTenantSlug_ =
      options.defaultTenantSlug ||
      process.env.CITYOS_DEFAULT_TENANT ||
      "dakkah";
  }

  private resolvePath(filename: string): string {
    if (filename.startsWith("tenants/")) {
      return filename;
    }

    if (
      filename.startsWith("domains/") ||
      filename.startsWith("media/") ||
      filename.startsWith("branding/") ||
      filename.startsWith("governance/") ||
      filename.startsWith("system/") ||
      filename.startsWith("workflows/") ||
      filename.startsWith("users/") ||
      filename.startsWith("poi/") ||
      filename.startsWith("templates/")
    ) {
      return `tenants/${this.defaultTenantSlug_}/${filename}`;
    }

    const basename = filename.split("/").pop() || filename;
    return buildTenantPath(
      this.defaultTenantSlug_,
      MEDUSA_PRODUCT_PREFIX,
      basename
    );
  }

  async upload(
    file: ProviderUploadFileDTO
  ): Promise<{ url: string; key: string }> {
    if (!file) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "No file provided"
      );
    }

    let content: Buffer;
    if (Buffer.isBuffer(file.content)) {
      content = file.content;
    } else {
      content = Buffer.from(file.content as any);
    }

    const resolvedPath = this.resolvePath(file.filename);

    const blob = await put(resolvedPath, content, {
      access: this.access_ as any,
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
      await del(file.fileKey.startsWith("http") ? file.fileKey : file.fileKey, {
        token: this.token_,
      });
    } catch (error: any) {
      console.error(
        `Failed to delete file ${file.fileKey} from Vercel Blob: ${error.message}`
      );
    }
  }

  async getPresignedDownloadUrl(
    fileData: ProviderGetFileDTO
  ): Promise<string> {
    if (fileData.fileKey.startsWith("http")) {
      return fileData.fileKey;
    }
    return `https://${fileData.fileKey}`;
  }
}
