import { MedusaService } from "@medusajs/framework/utils";
import DigitalAsset from "./models/digital-asset";
import DownloadLicense from "./models/download-license";

class DigitalProductModuleService extends MedusaService({
  DigitalAsset,
  DownloadLicense,
}) {
  /**
   * Generate a secure, time-limited download link for a digital asset.
   */
  async generateDownloadLink(
    assetId: string,
    customerId: string,
  ): Promise<{ url: string; expiresAt: Date }> {
    const asset = await this.retrieveDigitalAsset(assetId) as any;
    const license = await this.listDownloadLicenses({
      asset_id: assetId,
      customer_id: customerId,
      status: "active",
    }) as any;
    const licenseList = Array.isArray(license)
      ? license
      : [license].filter(Boolean);
    if (licenseList.length === 0) {
      throw new Error("No active license found for this asset and customer");
    }
    const token = `${assetId}-${customerId}-${Date.now().toString(36)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.trackDownload(assetId, customerId);
    return { url: `/downloads/${token}`, expiresAt };
  }

  /**
   * Validate a license key and return its status and associated asset.
   */
  async validateLicense(
    licenseKey: string,
  ): Promise<{ valid: boolean; license?: any; asset?: any }> {
    const licenses = await this.listDownloadLicenses({
      license_key: licenseKey,
    }) as any;
    const licenseList = Array.isArray(licenses)
      ? licenses
      : [licenses].filter(Boolean);
    if (licenseList.length === 0) {
      return { valid: false };
    }
    const license = licenseList[0];
    if (license.status !== "active") {
      return { valid: false, license };
    }
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return { valid: false, license };
    }
    const asset = await this.retrieveDigitalAsset(license.asset_id) as any;
    return { valid: true, license, asset };
  }

  /**
   * Track a download event for a digital asset by a customer.
   */
  async trackDownload(assetId: string, customerId: string): Promise<any> {
    const licenses = await this.listDownloadLicenses({
      asset_id: assetId,
      customer_id: customerId,
      status: "active",
    }) as any;
    const licenseList = Array.isArray(licenses)
      ? licenses
      : [licenses].filter(Boolean);
    if (licenseList.length === 0) {
      throw new Error("No active license found");
    }
    const license = licenseList[0];
    return await this.updateDownloadLicenses({
      id: license.id,
      download_count: (Number(license.download_count) || 0) + 1,
      last_downloaded_at: new Date(),
    } as any);
  }

  async purchaseLicense(
    productId: string,
    customerId: string,
    licenseType: string,
  ): Promise<any> {
    if (!productId || !customerId) {
      throw new Error("Product ID and customer ID are required");
    }
    const validTypes = ["single", "team", "enterprise", "lifetime"];
    if (!validTypes.includes(licenseType)) {
      throw new Error(`License type must be one of: ${validTypes.join(", ")}`);
    }
    const asset = await this.retrieveDigitalAsset(productId) as any;

    let maxActivations = 1;
    switch (licenseType) {
      case "single":
        maxActivations = 1;
        break;
      case "team":
        maxActivations = 5;
        break;
      case "enterprise":
        maxActivations = 50;
        break;
      case "lifetime":
        maxActivations = 999;
        break;
    }

    const licenseKey = `LIC-${licenseType.toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const expiresAt =
      licenseType === "lifetime"
        ? null
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    return await this.createDownloadLicenses({
      asset_id: productId,
      customer_id: customerId,
      license_key: licenseKey,
      license_type: licenseType,
      status: "active",
      max_activations: maxActivations,
      activation_count: 0,
      download_count: 0,
      expires_at: expiresAt,
      purchased_at: new Date(),
    } as any);
  }

  async verifyLicense(licenseKey: string): Promise<{
    valid: boolean;
    license?: any;
    remainingActivations?: number;
    expiresAt?: Date | null;
  }> {
    if (!licenseKey) {
      throw new Error("License key is required");
    }
    const licenses = await this.listDownloadLicenses({
      license_key: licenseKey,
    }) as any;
    const licenseList = Array.isArray(licenses)
      ? licenses
      : [licenses].filter(Boolean);
    if (licenseList.length === 0) {
      return { valid: false };
    }
    const license = licenseList[0];
    if (license.status !== "active") {
      return { valid: false, license };
    }
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      await this.updateDownloadLicenses({ id: license.id, status: "expired" } as any);
      return { valid: false, license };
    }
    const maxActivations = Number(license.max_activations || 1);
    const currentActivations = Number(license.activation_count || 0);
    const remainingActivations = Math.max(
      0,
      maxActivations - currentActivations,
    );

    return {
      valid: true,
      license,
      remainingActivations,
      expiresAt: license.expires_at || null,
    };
  }

  async revokeAccessWithReason(
    productId: string,
    customerId: string,
    reason?: string,
  ): Promise<any> {
    const licenses = await this.listDownloadLicenses({
      asset_id: productId,
      customer_id: customerId,
      status: "active",
    }) as any;
    const licenseList = Array.isArray(licenses)
      ? licenses
      : [licenses].filter(Boolean);
    if (licenseList.length === 0) {
      throw new Error("No active license found to revoke");
    }

    const revokedLicenses = [];
    for (const license of licenseList) {
      const updated = await this.updateDownloadLicenses({
        id: license.id,
        status: "revoked",
        revoked_at: new Date(),
        metadata: {
          ...(license.metadata || {} as any),
          revoke_reason: reason || "No reason provided",
          revoked_by: "system",
        },
      });
      revokedLicenses.push(updated);
    }

    return {
      productId,
      customerId,
      reason: reason || "No reason provided",
      revokedCount: revokedLicenses.length,
      revokedAt: new Date().toISOString(),
    };
  }

  /**
   * Revoke a customer's access to a digital asset by deactivating their license.
   */
  async revokeAccess(assetId: string, customerId: string): Promise<any> {
    const licenses = await this.listDownloadLicenses({
      asset_id: assetId,
      customer_id: customerId,
      status: "active",
    }) as any;
    const licenseList = Array.isArray(licenses)
      ? licenses
      : [licenses].filter(Boolean);
    if (licenseList.length === 0) {
      throw new Error("No active license found to revoke");
    }
    return await this.updateDownloadLicenses({
      id: licenseList[0].id,
      status: "revoked",
      revoked_at: new Date(),
    } as any);
  }

  async generateTimedDownloadLink(
    productId: string,
    customerId: string,
    expiresIn?: number,
  ): Promise<{
    url: string;
    token: string;
    expiresAt: Date;
    productId: string;
    customerId: string;
  }> {
    const asset = await this.retrieveDigitalAsset(productId) as any;
    if (!asset) {
      throw new Error("Digital product not found");
    }

    const licenses = await this.listDownloadLicenses({
      asset_id: productId,
      customer_id: customerId,
      status: "active",
    }) as any;
    const licenseList = Array.isArray(licenses)
      ? licenses
      : [licenses].filter(Boolean);
    if (licenseList.length === 0) {
      throw new Error("No active license found for this product and customer");
    }

    const license = licenseList[0];
    const maxDownloads = Number(license.max_downloads || 100);
    const currentDownloads = Number(license.download_count || 0);
    if (currentDownloads >= maxDownloads) {
      throw new Error("Download limit reached for this license");
    }

    const ttlMs = (expiresIn || 3600) * 1000;
    const expiresAt = new Date(Date.now() + ttlMs);
    const token = `DL-${productId.slice(0, 8)}-${customerId.slice(0, 8)}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`;

    return {
      url: `/downloads/${token}`,
      token,
      expiresAt,
      productId,
      customerId,
    };
  }

  async trackDownloadWithLimits(
    productId: string,
    customerId: string,
  ): Promise<{
    productId: string;
    customerId: string;
    downloadCount: number;
    maxDownloads: number;
    remainingDownloads: number;
    limitReached: boolean;
  }> {
    const licenses = await this.listDownloadLicenses({
      asset_id: productId,
      customer_id: customerId,
      status: "active",
    }) as any;
    const licenseList = Array.isArray(licenses)
      ? licenses
      : [licenses].filter(Boolean);
    if (licenseList.length === 0) {
      throw new Error("No active license found");
    }

    const license = licenseList[0];
    const maxDownloads = Number(license.max_downloads || 100);
    const currentDownloads = Number(license.download_count || 0);

    if (currentDownloads >= maxDownloads) {
      return {
        productId,
        customerId,
        downloadCount: currentDownloads,
        maxDownloads,
        remainingDownloads: 0,
        limitReached: true,
      };
    }

    const newCount = currentDownloads + 1;
    await this.updateDownloadLicenses({
      id: license.id,
      download_count: newCount,
      last_downloaded_at: new Date(),
    } as any);

    return {
      productId,
      customerId,
      downloadCount: newCount,
      maxDownloads,
      remainingDownloads: Math.max(0, maxDownloads - newCount),
      limitReached: newCount >= maxDownloads,
    };
  }
}

export default DigitalProductModuleService;
