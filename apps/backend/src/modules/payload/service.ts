import { MedusaService } from "@medusajs/framework/utils";
import { PayloadRecord } from "./models/payload-record";
import { Logger } from "@medusajs/framework/types";

type InjectedDependencies = {
  logger: Logger;
};

export default class PayloadModuleService extends MedusaService({
  PayloadRecord,
}) {
  private logger_: Logger;
  private apiUrl: string;
  private apiKey: string;

  constructor(
    { logger }: InjectedDependencies,
    options?: { api_url?: string; api_key?: string },
  ) {
    // @ts-ignore
    super(...arguments);
    this.logger_ = logger;
    this.apiUrl =
      options?.api_url ||
      process.env.PAYLOAD_API_URL ||
      "http://localhost:3001";
    this.apiKey = options?.api_key || process.env.PAYLOAD_API_KEY || "";
  }

  /**
   * Updates a document in Payload CMS
   */
  async updateDocument(
    collectionSlug: string,
    docId: string,
    payload: Record<string, any>,
  ) {
    const url = `${this.apiUrl}/api/${collectionSlug}/${docId}?source=medusa_sync`;
    this.logger_.info(`[PayloadModule] PATCH ${url}`);

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `users API-Key ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorText = await response.text();
      try {
        const json = JSON.parse(errorText);
        errorText = json.errors?.[0]?.message || JSON.stringify(json);
      } catch (e) {}
      throw new Error(
        `Failed to update Payload document (${response.status}): ${errorText}`,
      );
    }

    return await response.json();
  }

  /**
   * Healthcheck function to verify connection
   */
  async checkConnection() {
    try {
      const url = `${this.apiUrl}/api/users?limit=1`;
      const response = await fetch(url, {
        headers: {
          Authorization: `users API-Key ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  }
}
