// @ts-nocheck
import axios, { AxiosInstance } from "axios";
import { MedusaError } from "@medusajs/framework/utils";
import { createLogger } from "../../lib/logger"
const logger = createLogger("integration:waltid")

export interface WaltIdConfig {
  apiUrl: string;
  apiKey: string;
  walletUrl?: string;
  issuerDid?: string;
}

export class WaltIdService {
  private client: AxiosInstance;
  private config: WaltIdConfig;

  constructor(config: WaltIdConfig) {
    if (!config.apiUrl || !config.apiKey) {
      logger.warn("[WaltId] Missing apiUrl or apiKey configuration");
    }

    this.config = config;
    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  async createDID(method: string = "key"): Promise<{
    did: string;
    document: Record<string, any>;
  }> {
    try {
      logger.info(`[WaltId] Creating DID with method: did:${method}`);
      const response = await this.client.post("/v1/did/create", {
        method,
      });

      return {
        did: response.data.did,
        document: response.data.document || response.data,
      };
    } catch (error: unknown) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `[WaltId] Failed to create DID: ${error.response?.data?.message || (error instanceof Error ? error.message : String(error))}`
      );
    }
  }

  async resolveDID(did: string): Promise<{
    did: string;
    document: Record<string, any>;
  }> {
    try {
      logger.info(`[WaltId] Resolving DID: ${did}`);
      const response = await this.client.post("/v1/did/resolve", {
        did,
      });

      return {
        did,
        document: response.data.document || response.data,
      };
    } catch (error: unknown) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `[WaltId] Failed to resolve DID: ${error.response?.data?.message || (error instanceof Error ? error.message : String(error))}`
      );
    }
  }

  async issueCredential(data: {
    issuerDid: string;
    subjectDid: string;
    credentialType: string;
    claims: Record<string, any>;
    expirationDate?: string;
  }): Promise<{
    credential: Record<string, any>;
    credentialId: string;
  }> {
    try {
      logger.info(`[WaltId] Issuing credential of type: ${data.credentialType}`);
      const payload: Record<string, any> = {
        issuerDid: data.issuerDid,
        subjectDid: data.subjectDid,
        credentialData: {
          "@context": [
            "https://www.w3.org/2018/credentials/v1",
          ],
          type: ["VerifiableCredential", data.credentialType],
          issuer: data.issuerDid,
          credentialSubject: {
            id: data.subjectDid,
            ...data.claims,
          },
        },
      };

      if (data.expirationDate) {
        payload.credentialData.expirationDate = data.expirationDate;
      }

      const response = await this.client.post("/v1/credentials/issue", payload);

      return {
        credential: response.data.credential || response.data,
        credentialId: response.data.id || response.data.credential?.id || "",
      };
    } catch (error: unknown) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `[WaltId] Failed to issue credential: ${error.response?.data?.message || (error instanceof Error ? error.message : String(error))}`
      );
    }
  }

  async verifyCredential(credential: string | object): Promise<{
    valid: boolean;
    checks: string[];
    errors: string[];
  }> {
    try {
      logger.info("[WaltId] Verifying credential");
      const response = await this.client.post("/v1/credentials/verify", {
        credential: typeof credential === "string" ? credential : JSON.stringify(credential),
      });

      return {
        valid: response.data.valid ?? response.data.verified ?? false,
        checks: response.data.checks || [],
        errors: response.data.errors || [],
      };
    } catch (error: unknown) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `[WaltId] Failed to verify credential: ${error.response?.data?.message || (error instanceof Error ? error.message : String(error))}`
      );
    }
  }

  async listCredentials(holderDid: string): Promise<Array<Record<string, any>>> {
    try {
      logger.info(`[WaltId] Listing credentials for holder: ${holderDid}`);
      const response = await this.client.get("/v1/credentials", {
        params: { holderDid },
      });

      return response.data.credentials || response.data || [];
    } catch (error: unknown) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `[WaltId] Failed to list credentials: ${error.response?.data?.message || (error instanceof Error ? error.message : String(error))}`
      );
    }
  }

  async revokeCredential(credentialId: string): Promise<{ success: boolean }> {
    try {
      logger.info(`[WaltId] Revoking credential: ${credentialId}`);
      await this.client.post("/v1/credentials/revoke", {
        credentialId,
      });

      return { success: true };
    } catch (error: unknown) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `[WaltId] Failed to revoke credential: ${error.response?.data?.message || (error instanceof Error ? error.message : String(error))}`
      );
    }
  }

  async issueKYCCredential(data: {
    subjectDid: string;
    customerName: string;
    customerEmail: string;
    verificationLevel: string;
    tenantId: string;
    nodeId: string;
  }): Promise<{
    credential: Record<string, any>;
    credentialId: string;
  }> {
    const issuerDid = this.config.issuerDid;
    if (!issuerDid) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "[WaltId] Issuer DID not configured"
      );
    }

    logger.info(`[WaltId] Issuing KYC credential for: ${data.customerEmail}`);
    return this.issueCredential({
      issuerDid,
      subjectDid: data.subjectDid,
      credentialType: "KYCVerificationCredential",
      claims: {
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        verificationLevel: data.verificationLevel,
        tenantId: data.tenantId,
        nodeId: data.nodeId,
        verifiedAt: new Date().toISOString(),
      },
    });
  }

  async issueVendorCredential(data: {
    subjectDid: string;
    vendorName: string;
    businessLicense: string;
    tenantId: string;
  }): Promise<{
    credential: Record<string, any>;
    credentialId: string;
  }> {
    const issuerDid = this.config.issuerDid;
    if (!issuerDid) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "[WaltId] Issuer DID not configured"
      );
    }

    logger.info(`[WaltId] Issuing vendor credential for: ${data.vendorName}`);
    return this.issueCredential({
      issuerDid,
      subjectDid: data.subjectDid,
      credentialType: "VendorVerificationCredential",
      claims: {
        vendorName: data.vendorName,
        businessLicense: data.businessLicense,
        tenantId: data.tenantId,
        verifiedAt: new Date().toISOString(),
      },
    });
  }

  async issueMembershipCredential(data: {
    subjectDid: string;
    memberName: string;
    membershipType: string;
    tenantId: string;
    nodeId: string;
    validUntil: string;
  }): Promise<{
    credential: Record<string, any>;
    credentialId: string;
  }> {
    const issuerDid = this.config.issuerDid;
    if (!issuerDid) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "[WaltId] Issuer DID not configured"
      );
    }

    logger.info(`[WaltId] Issuing membership credential for: ${data.memberName}`);
    return this.issueCredential({
      issuerDid,
      subjectDid: data.subjectDid,
      credentialType: "CityOSMembershipCredential",
      claims: {
        memberName: data.memberName,
        membershipType: data.membershipType,
        tenantId: data.tenantId,
        nodeId: data.nodeId,
        validUntil: data.validUntil,
        issuedAt: new Date().toISOString(),
      },
      expirationDate: data.validUntil,
    });
  }

  async issueTenantOperatorCredential(data: {
    did: string;
    tenantId: string;
    tenantName: string;
    role: string;
    permissions: string[];
    nodeScope?: string;
  }): Promise<{
    credential: Record<string, any>;
    credentialId: string;
  }> {
    const issuerDid = this.config.issuerDid;
    if (!issuerDid) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "[WaltId] Issuer DID not configured"
      );
    }

    logger.info(`[WaltId] Issuing tenant operator credential for: ${data.tenantName}`);
    return this.issueCredential({
      issuerDid,
      subjectDid: data.did,
      credentialType: "TenantOperatorCredential",
      claims: {
        tenantId: data.tenantId,
        tenantName: data.tenantName,
        role: data.role,
        permissions: data.permissions,
        nodeScope: data.nodeScope,
        issuedAt: new Date().toISOString(),
      },
    });
  }

  async issuePOIVerificationCredential(data: {
    did: string;
    poiId: string;
    poiName: string;
    category: string;
    location: { lat: number; lng: number };
    verifiedBy: string;
  }): Promise<{
    credential: Record<string, any>;
    credentialId: string;
  }> {
    const issuerDid = this.config.issuerDid;
    if (!issuerDid) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "[WaltId] Issuer DID not configured"
      );
    }

    logger.info(`[WaltId] Issuing POI verification credential for: ${data.poiName}`);
    return this.issueCredential({
      issuerDid,
      subjectDid: data.did,
      credentialType: "POIVerificationCredential",
      claims: {
        poiId: data.poiId,
        poiName: data.poiName,
        category: data.category,
        location: data.location,
        verifiedBy: data.verifiedBy,
        verifiedAt: new Date().toISOString(),
      },
    });
  }

  async issueMarketplaceSellerCredential(data: {
    did: string;
    vendorId: string;
    vendorName: string;
    marketplaceId: string;
    verificationLevel: string;
    categories: string[];
  }): Promise<{
    credential: Record<string, any>;
    credentialId: string;
  }> {
    const issuerDid = this.config.issuerDid;
    if (!issuerDid) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "[WaltId] Issuer DID not configured"
      );
    }

    logger.info(`[WaltId] Issuing marketplace seller credential for: ${data.vendorName}`);
    return this.issueCredential({
      issuerDid,
      subjectDid: data.did,
      credentialType: "MarketplaceSellerCredential",
      claims: {
        vendorId: data.vendorId,
        vendorName: data.vendorName,
        marketplaceId: data.marketplaceId,
        verificationLevel: data.verificationLevel,
        categories: data.categories,
        issuedAt: new Date().toISOString(),
      },
    });
  }

  async verifyIdentity(did: string): Promise<{
    verified: boolean;
    did: string;
    document: Record<string, any>;
    credentials: Array<Record<string, any>>;
    errors: string[];
  }> {
    const errors: string[] = [];
    let document: Record<string, any> = {};
    let credentials: Array<Record<string, any>> = [];

    try {
      logger.info(`[WaltId] Verifying identity for DID: ${did}`);

      const resolved = await this.resolveDID(did);
      document = resolved.document;
    } catch (error: unknown) {
      errors.push(`DID resolution failed: ${(error instanceof Error ? error.message : String(error))}`);
    }

    try {
      credentials = await this.listCredentials(did);
    } catch (error: unknown) {
      errors.push(`Credential listing failed: ${(error instanceof Error ? error.message : String(error))}`);
    }

    return {
      verified: errors.length === 0 && Object.keys(document).length > 0,
      did,
      document,
      credentials,
      errors,
    };
  }
}
