import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createHmac } from "crypto";
import { createLogger } from "../../../../lib/logger";
import { handleApiError } from "../../../../lib/api-error-handler";
import { appConfig } from "../../../../lib/config";
const logger = createLogger("api:admin/webhooks");

interface IQuery {
  graph(
    opts: Record<string, unknown>,
  ): Promise<{ data: Array<Record<string, unknown>> }>;
}
interface IOrderModuleService {
  updateOrders(update: Record<string, unknown>): Promise<void>;
}

/** Typed shape of Fleetbase webhook data payloads */
interface FleetbaseEventData {
  id?: string;
  status?: string;
  order_id?: string;
  tracking_number?: string;
  public_id?: string;
  location?: string | null;
  meta?: { order_id?: string };
  driver_assigned?: { name?: string; id?: string };
  driver_name?: string;
  driver_id?: string;
  [key: string]: unknown;
}
interface FleetbaseWebhookBody {
  event?: string;
  data?: FleetbaseEventData;
  [key: string]: unknown;
}

function verifyFleetbaseSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const computed = createHmac("sha256", secret).update(payload).digest("hex");
  return computed === signature;
}

// Webhook payloads validated by signature verification
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!appConfig.fleetbase.isConfigured) {
    return res.status(503).json({
      success: false,
      message: "Service not configured",
      service: "fleetbase",
    });
  }

  try {
    const secret = appConfig.fleetbase.webhookSecret;
    if (secret) {
      const signature = req.headers["x-fleetbase-signature"] as string;
      if (!signature) {
        logger.info("[Webhook:Fleetbase] Missing signature header");
        return res.status(401).json({ error: "Missing signature" });
      }
      const rawBody =
        typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      if (!verifyFleetbaseSignature(rawBody, signature, secret)) {
        logger.info("[Webhook:Fleetbase] Invalid signature");
        return res.status(401).json({ error: "Invalid signature" });
      }
    }

    const body = req.body as FleetbaseWebhookBody;
    const event = body.event ?? "unknown";
    const data: FleetbaseEventData = body.data ?? {};

    logger.info(`[Webhook:Fleetbase] Received event: ${event}`);

    let processed = false;

    switch (event) {
      case "order.status_changed": {
        const orderId = data.meta?.order_id || data.order_id;
        const newStatus = data.status;
        logger.info(
          `[Webhook:Fleetbase] Order status changed: ${orderId || "unknown"} -> ${newStatus}`,
        );
        processed = true;
        break;
      }

      case "order.completed": {
        const orderId = data.meta?.order_id || data.order_id;
        if (orderId) {
          try {
            const query = req.scope.resolve("query") as unknown as IQuery;
            const { data: orders } = await query.graph({
              entity: "order",
              fields: ["id", "metadata"],
              filters: { id: orderId },
            });

            if (orders && orders.length > 0) {
              const orderModuleService = req.scope.resolve(
                "orderModuleService",
              ) as unknown as IOrderModuleService;
              await orderModuleService.updateOrders({
                id: orderId,
                metadata: {
                  ...((orders[0].metadata as Record<string, unknown>) ?? {}),
                  fleetbase_status: "completed",
                  fleetbase_completed_at: new Date().toISOString(),
                  fleetbase_shipment_id: data.id,
                },
              });
              logger.info(
                `[Webhook:Fleetbase] Order ${orderId} marked as delivered`,
              );
            }
          } catch (error: unknown) {
            logger.error(
              `[Webhook:Fleetbase] updating order fulfillment: ${error instanceof Error ? (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) : String(error)}`,
            );
          }
        }
        processed = true;
        break;
      }

      case "order.driver_assigned": {
        const orderId = data.meta?.order_id || data.order_id;
        const driverName = data.driver_assigned?.name || data.driver_name;
        logger.info(
          `[Webhook:Fleetbase] Driver assigned to order ${orderId || "unknown"}: ${driverName || "unknown"}`,
        );
        if (orderId) {
          try {
            const query = req.scope.resolve("query") as unknown as IQuery;
            const { data: orders } = await query.graph({
              entity: "order",
              fields: ["id", "metadata"],
              filters: { id: orderId },
            });

            if (orders && orders.length > 0) {
              const orderModuleService = req.scope.resolve(
                "orderModuleService",
              ) as unknown as IOrderModuleService;
              await orderModuleService.updateOrders({
                id: orderId,
                metadata: {
                  ...((orders[0].metadata as Record<string, unknown>) ?? {}),
                  fleetbase_driver_name: driverName,
                  fleetbase_driver_id:
                    data.driver_assigned?.id || data.driver_id,
                  fleetbase_driver_assigned_at: new Date().toISOString(),
                },
              });
            }
          } catch (error: unknown) {
            logger.error(
              `[Webhook:Fleetbase] updating driver assignment: ${error instanceof Error ? (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) : String(error)}`,
            );
          }
        }
        processed = true;
        break;
      }

      case "tracking.updated": {
        const orderId = data.meta?.order_id || data.order_id;
        if (orderId) {
          try {
            const query = req.scope.resolve("query") as unknown as IQuery;
            const { data: orders } = await query.graph({
              entity: "order",
              fields: ["id", "metadata"],
              filters: { id: orderId },
            });

            if (orders && orders.length > 0) {
              const orderModuleService = req.scope.resolve(
                "orderModuleService",
              ) as unknown as IOrderModuleService;
              await orderModuleService.updateOrders({
                id: orderId,
                metadata: {
                  ...((orders[0].metadata as Record<string, unknown>) ?? {}),
                  fleetbase_tracking: {
                    status: data.status,
                    location: data.location || null,
                    updated_at: new Date().toISOString(),
                    tracking_number: data.tracking_number || data.public_id,
                  },
                },
              });
              logger.info(
                `[Webhook:Fleetbase] Tracking updated for order ${orderId}`,
              );
            }
          } catch (error: unknown) {
            logger.error(
              `[Webhook:Fleetbase] updating tracking: ${error instanceof Error ? (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) : String(error)}`,
            );
          }
        }
        processed = true;
        break;
      }

      default:
        logger.info(`[Webhook:Fleetbase] Unhandled event: ${event}`);
        break;
    }

    return res.status(200).json({ received: true, event, processed });
  } catch (error: unknown) {
    logger.error(
      `[Webhook:Fleetbase] ${error instanceof Error ? (error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)) : String(error)}`,
    );
    return handleApiError(res, error, "ADMIN-WEBHOOKS-FLEETBASE");
  }
}
