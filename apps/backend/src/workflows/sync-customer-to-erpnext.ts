import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";

type ERPNextCustomerSyncInput = {
  customerId: string;
};

export const postCustomerToErpnextStep = createStep(
  "post-customer-to-erpnext",
  async (customerData: any, { container }) => {
    const logger = container.resolve("logger");
    const appConfigModule = await import("../lib/config.js");
    const appConfig = appConfigModule.appConfig;

    if (!appConfig.erpnext.isConfigured || !appConfig.erpnext.url) {
      logger.info(
        "[ERPNextSync] ERPNext is not configured, skipping Customer outbound sync.",
      );
      return new StepResponse({
        success: false,
        data: null,
        error: "Not Configured",
      });
    }

    try {
      const baseUrl = appConfig.erpnext.url.replace(/\/$/, "");
      const apiKey = appConfig.erpnext.apiKey || "";
      const apiSecret = appConfig.erpnext.apiSecret || "";

      const authHeader = `token ${apiKey}:${apiSecret}`;

      let fullName = "Guest Shopper";
      if (customerData?.first_name || customerData?.last_name) {
        fullName =
          `${customerData.first_name || ""} ${customerData.last_name || ""}`.trim();
      }

      // Build Customer Payload for ERPNext
      const customerPayload = {
        doctype: "Customer",
        customer_name: fullName,
        customer_type: "Individual",
        customer_group: "Commercial",
        territory: "All Territories",
        email_id: customerData?.email || "",
        custom_medusa_customer_id: customerData?.id,
      };

      logger.info(
        `[ERPNextSync] Pushing Customer to ERPNext for Medusa User: ${customerData.id}`,
      );

      const response = await fetch(`${baseUrl}/api/resource/Customer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
          Accept: "application/json",
        },
        body: JSON.stringify(customerPayload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(
          `ERPNext API responded with ${response.status}: ${errText}`,
        );
      }

      const responseData = await response.json();

      return new StepResponse({
        success: true,
        data: responseData.data,
        error: null,
      });
    } catch (error: any) {
      logger.error(
        `[ERPNextSync] Failed to push customer ${customerData.id}: ${error.message}`,
      );
      return new StepResponse({
        success: false,
        data: null,
        error: error.message,
      });
    }
  },
);

// The main customer sync workflow
export const syncCustomerToErpnextWorkflow = createWorkflow(
  {
    name: "sync-customer-to-erpnext",
  },
  (input: ERPNextCustomerSyncInput) => {
    // Query the complete customer structure
    const { data: customers } = useQueryGraphStep({
      entity: "customer",
      fields: ["id", "email", "first_name", "last_name", "phone"],
      filters: { id: input.customerId },
    });

    const extractCustomerStep = createStep(
      "extract-customer",
      async (customerList: any[]) => {
        return new StepResponse(customerList?.[0] || null);
      },
    );

    const customerData = extractCustomerStep(customers);

    // Execute the outbound request
    const result = postCustomerToErpnextStep(customerData);

    return new WorkflowResponse(result);
  },
);
