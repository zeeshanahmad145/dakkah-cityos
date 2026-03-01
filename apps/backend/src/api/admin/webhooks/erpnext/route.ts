import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import crypto from "crypto";
import { createLogger } from "../../../../lib/logger";
import { handleApiError } from "../../../../lib/api-error-handler";
import { appConfig } from "../../../../lib/config";
const logger = createLogger("api:admin/webhooks");

// Webhook payloads validated by signature verification
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!appConfig.erpnext.isConfigured) {
    return res
      .status(503)
      .json({
        success: false,
        message: "Service not configured",
        service: "erpnext",
      });
  }

  try {
    const secret = appConfig.erpnext.webhookSecret;
    if (secret) {
      const headerSecret = req.headers["x-erpnext-secret"] as string;
      const expectedSig = crypto
        .createHmac("sha256", secret)
        .update(JSON.stringify(req.body))
        .digest("hex");
      if (headerSecret !== expectedSig) {
        logger.info("[Webhook:ERPNext] Invalid secret");
        return res.status(401).json({ error: "Invalid secret" });
      }
    }

    const body = req.body as Record<string, any>;
    const doctype = body.doctype || "unknown";
    const event = body.event || "unknown";
    const data = body.data || {};

    logger.info(`[Webhook:ERPNext] Received: ${doctype} - ${event}`);

    let processed = false;

    switch (doctype) {
      case "Sales Invoice": {
        if (event === "on_submit" || event === "submitted") {
          const medusaOrderId =
            data.custom_medusa_order_id || data.medusa_order_id;
          if (medusaOrderId) {
            try {
              const query = req.scope.resolve("query") as unknown as any;
              const { data: orders } = await query.graph({
                entity: "order",
                fields: ["id", "metadata"],
                filters: { id: medusaOrderId },
              });

              if (orders && orders.length > 0) {
                const orderModuleService =
                  req.scope.resolve("orderModuleService") as unknown as any;
                await orderModuleService.updateOrders({
                  id: medusaOrderId,
                  metadata: {
                    ...orders[0].metadata,
                    erpnext_invoice_name: data.name,
                    erpnext_invoice_status: "submitted",
                    erpnext_invoice_synced_at: new Date().toISOString(),
                  },
                });
                processed = true;
                logger.info(
                  `[Webhook:ERPNext] Invoice ${data.name} linked to order ${medusaOrderId}`,
                );
              }
            } catch (error: unknown) {
              logger.error(
                `[Webhook:ERPNext] updating order metadata: ${error instanceof Error ? (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) : error}`,
              );
            }
          }
        } else if (event === "on_cancel" || event === "cancelled") {
          const medusaOrderId =
            data.custom_medusa_order_id || data.medusa_order_id;
          if (medusaOrderId) {
            try {
              const query = req.scope.resolve("query") as unknown as any;
              const { data: orders } = await query.graph({
                entity: "order",
                fields: ["id", "metadata"],
                filters: { id: medusaOrderId },
              });

              if (orders && orders.length > 0) {
                const orderModuleService =
                  req.scope.resolve("orderModuleService") as unknown as any;
                await orderModuleService.updateOrders({
                  id: medusaOrderId,
                  metadata: {
                    ...orders[0].metadata,
                    erpnext_invoice_status: "cancelled",
                    erpnext_invoice_cancelled_at: new Date().toISOString(),
                  },
                });
                processed = true;
                logger.info(
                  `[Webhook:ERPNext] Invoice ${data.name} cancelled for order ${medusaOrderId}`,
                );
              }
            } catch (error: unknown) {
              logger.error(
                `[Webhook:ERPNext] updating cancelled invoice: ${error instanceof Error ? (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) : error}`,
              );
            }
          }
        }
        break;
      }

      case "Payment Entry": {
        if (event === "on_submit" || event === "submitted") {
          const medusaOrderId =
            data.custom_medusa_order_id || data.medusa_order_id;
          logger.info(
            `[Webhook:ERPNext] Payment Entry submitted: ${data.name}, order: ${medusaOrderId || "N/A"}`,
          );
          processed = true;
        }
        break;
      }

      case "Stock Entry": {
        if (event === "on_submit" || event === "posted") {
          logger.info(
            `[Webhook:ERPNext] Stock Entry posted: ${data.name}, type: ${data.stock_entry_type || "unknown"}`,
          );
          if (data.items && Array.isArray(data.items)) {
            for (const item of data.items) {
              logger.info(
                `[Webhook:ERPNext] Inventory change: ${item.item_code} qty: ${item.qty} warehouse: ${item.t_warehouse || item.s_warehouse}`,
              );
            }
          }
          processed = true;
        }
        break;
      }

      case "Customer": {
        if (event === "on_update" || event === "updated") {
          logger.info(
            `[Webhook:ERPNext] Customer updated: ${data.name}, medusa_id: ${data.custom_medusa_customer_id || "N/A"}`,
          );
          processed = true;
        }
        break;
      }

      default:
        logger.info(
          `[Webhook:ERPNext] Unhandled doctype: ${doctype}, event: ${event}`,
        );
        break;
    }

    return res.status(200).json({ received: true, doctype, event, processed });
  } catch (error: unknown) {
    logger.error(
      `[Webhook:ERPNext] ${error instanceof Error ? (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) : error}`,
    );
    return handleApiError(res, error, "ADMIN-WEBHOOKS-ERPNEXT");
  }
}
