import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";

type ERPNextOrderSyncInput = {
  orderId: string;
};

// 1. A step to POST the order to ERPNext using global fetch
export const postToErpnextStep = createStep(
  "post-order-to-erpnext",
  async (orderData: any, { container }) => {
    const logger = container.resolve("logger");
    const appConfigModule = await import("../lib/config.js");
    const appConfig = appConfigModule.appConfig;

    if (!appConfig.erpnext.isConfigured || !appConfig.erpnext.url) {
      logger.info(
        "[ERPNextSync] ERPNext is not configured, skipping outbound sync.",
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

      // Build Sales Order Payload for ERPNext
      const salesOrderPayload = {
        doctype: "Sales Order",
        customer: orderData.customer?.email || "Guest",
        order_type: "Sales",
        transaction_date: new Date().toISOString().split("T")[0],
        delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0], // +7 days
        company: "Dakkah", // Default company name, could be dynamic
        currency: orderData.currency_code?.toUpperCase() || "USD",
        items:
          orderData.items?.map((item: any) => ({
            item_code: item.thumbnail || item.title, // Map to ERPNext Item Code
            qty: item.quantity,
            rate: (item.unit_price || 0) / 100, // Assuming cents to standard
            description: item.title,
          })) || [],
        custom_medusa_order_id: orderData.id,
      };

      logger.info(
        `[ERPNextSync] Pushing Sales Order for Medusa Order: ${orderData.id}`,
      );

      const response = await fetch(`${baseUrl}/api/resource/Sales%20Order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
          Accept: "application/json",
        },
        body: JSON.stringify(salesOrderPayload),
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
        `[ERPNextSync] Failed to push order ${orderData.id}: ${error.message}`,
      );
      return new StepResponse({
        success: false,
        data: null,
        error: error.message,
      });
    }
  },
);

// 2. The main workflow definition
export const syncOrderToErpnextWorkflow = createWorkflow(
  {
    name: "sync-order-to-erpnext",
  },
  (input: ERPNextOrderSyncInput) => {
    // A. Query the complete order structure
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: [
        "id",
        "total",
        "currency_code",
        "customer.email",
        "customer.first_name",
        "customer.last_name",
        "items.*",
      ],
      filters: { id: input.orderId },
    });

    // B. Transform to extract the single order instance
    const extractOrderStep = createStep(
      "extract-order",
      async (ordersList: any[]) => {
        return new StepResponse(ordersList?.[0] || null);
      },
    );

    const orderData = extractOrderStep(orders);

    // C. Execute the outbound request
    const result = postToErpnextStep(orderData);

    return new WorkflowResponse(result);
  },
);
