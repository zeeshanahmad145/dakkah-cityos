// @ts-nocheck
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import crypto from "crypto";
import { createLogger } from "../../../lib/logger";
import { handleApiError } from "../../../lib/api-error-handler";
import { appConfig } from "../../../lib/config";
const logger = createLogger("api:webhooks/stripe");

async function handlePaymentIntentSucceeded(
  data: any,
  correlationId: string,
  req: MedusaRequest,
) {
  const paymentIntent = data;
  const orderId =
    paymentIntent.metadata?.medusa_order_id || paymentIntent.metadata?.orderId;
  logger.info(
    `[Webhook:Stripe] payment_intent.succeeded: ${paymentIntent.id}, order: ${orderId || "N/A"}, correlation: ${correlationId}`,
  );

  if (orderId) {
    try {
      const { dispatchEventToTemporal } = await import(
        "../../../lib/event-dispatcher.js"
      );
      await dispatchEventToTemporal(
        "payment.completed",
        {
          order_id: orderId,
          payment_intent_id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          tenant_id: paymentIntent.metadata?.tenantId,
        },
        {
          tenantId: paymentIntent.metadata?.tenantId,
          correlationId,
          source: "stripe-webhook",
        },
      );
    } catch (error: unknown) {}
  }
}

async function handlePaymentIntentFailed(data: any, correlationId: string) {
  const paymentIntent = data;
  logger.info(
    `[Webhook:Stripe] payment_intent.failed: ${paymentIntent.id}, correlation: ${correlationId}`,
  );
  logger.info(
    `[Webhook:Stripe] Failure reason: ${paymentIntent.last_payment_error?.message || "Unknown"}`,
  );
}

async function handleChargeRefunded(data: any, correlationId: string) {
  const charge = data;
  logger.info(
    `[Webhook:Stripe] charge.refunded: ${charge.id}, amount_refunded: ${charge.amount_refunded}, correlation: ${correlationId}`,
  );
}

async function handleCheckoutSessionCompleted(
  data: any,
  correlationId: string,
) {
  const session = data;
  logger.info(
    `[Webhook:Stripe] checkout.session.completed: ${session.id}, payment_status: ${session.payment_status}, correlation: ${correlationId}`,
  );
}

async function handleInvoicePaid(data: any, correlationId: string) {
  const invoice = data;
  logger.info(
    `[Webhook:Stripe] invoice.paid: ${invoice.id}, amount_paid: ${invoice.amount_paid}, correlation: ${correlationId}`,
  );
}

async function handleInvoicePaymentFailed(data: any, correlationId: string) {
  const invoice = data;
  logger.info(
    `[Webhook:Stripe] invoice.payment_failed: ${invoice.id}, correlation: ${correlationId}`,
  );
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const correlationId = crypto.randomUUID();

  if (!appConfig.stripe.secretKey) {
    return res
      .status(503)
      .json({
        success: false,
        message: "Service not configured",
        service: "stripe",
      });
  }

  try {
    const webhookSecret = appConfig.stripe.webhookSecret;
    let stripeEvent: any;

    if (webhookSecret) {
      const signature = req.headers["stripe-signature"] as string;
      if (!signature) {
        logger.info(
          `[Webhook:Stripe] Missing stripe-signature header (correlation: ${correlationId})`,
        );
        return res.status(400).json({ error: "Missing signature" });
      }

      try {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(appConfig.stripe.secretKey);
        const rawBody =
          typeof req.body === "string" ? req.body : JSON.stringify(req.body);
        stripeEvent = stripe.webhooks.constructEvent(
          rawBody,
          signature,
          webhookSecret,
        );
      } catch (error: unknown) {
        logger.info(
          `[Webhook:Stripe] Signature verification failed (correlation: ${correlationId}): ${(error instanceof Error ? error.message : String(error))}`,
        );
        return handleApiError(res, error, "WEBHOOKS-STRIPE");
      }
    } else {
      stripeEvent = {
        type: req.body?.type || "unknown",
        data: req.body?.data || {},
      };
    }

    logger.info(
      `[Webhook:Stripe] Received event: ${stripeEvent.type} (correlation: ${correlationId})`,
    );

    const eventData = stripeEvent.data?.object || stripeEvent.data || {};

    switch (stripeEvent.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(eventData, correlationId, req);
        break;
      case "payment_intent.failed":
        await handlePaymentIntentFailed(eventData, correlationId);
        break;
      case "charge.refunded":
        await handleChargeRefunded(eventData, correlationId);
        break;
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(eventData, correlationId);
        break;
      case "invoice.paid":
        await handleInvoicePaid(eventData, correlationId);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(eventData, correlationId);
        break;
      default:
        logger.info(
          `[Webhook:Stripe] Unhandled event type: ${stripeEvent.type} (correlation: ${correlationId})`,
        );
        break;
    }

    return res
      .status(200)
      .json({
        received: true,
        type: stripeEvent.type,
        correlation_id: correlationId,
      });
  } catch (error: unknown) {
    return handleApiError(res, error, "WEBHOOKS-STRIPE");
  }
}
