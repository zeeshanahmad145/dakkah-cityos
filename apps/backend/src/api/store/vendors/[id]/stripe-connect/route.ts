// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../../lib/api-error-handler";
import { appConfig } from "../../../../../lib/config";

const stripeConnectSchema = z.object({
  return_url: z.string().optional(),
  refresh_url: z.string().optional(),
});

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const query = req.scope.resolve("query") as unknown as any;

  const { data: vendors } = await query.graph({
    entity: "vendors",
    fields: [
      "id",
      "stripe_account_id",
      "stripe_onboarding_complete",
      "stripe_payouts_enabled",
    ],
    filters: { id },
  });

  if (!vendors.length) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  const vendor = vendors[0];

  res.json({
    vendor_id: vendor.id,
    stripe_account_id: vendor.stripe_account_id,
    onboarding_complete: vendor.stripe_onboarding_complete || false,
    payouts_enabled: vendor.stripe_payouts_enabled || false,
  });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id;
  if (!customerId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const parsed = stripeConnectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.issues });
  }

  const { id } = req.params;
  const { return_url, refresh_url } = parsed.data;
  const query = req.scope.resolve("query") as unknown as any;
  const vendorService = req.scope.resolve("vendorModuleService") as unknown as any;

  const { data: vendors } = await query.graph({
    entity: "vendors",
    fields: ["id", "name", "email", "stripe_account_id"],
    filters: { id },
  });

  if (!vendors.length) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  const vendor = vendors[0];

  const stripeSecretKey = appConfig.stripe.secretKey;
  if (!stripeSecretKey) {
    return res.status(400).json({
      message:
        "Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables.",
    });
  }

  try {
    const stripe = require("stripe")(stripeSecretKey);

    let stripeAccountId = vendor.stripe_account_id;

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: vendor.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: vendor.name,
        },
      });

      stripeAccountId = account.id;

      await vendorService.updateVendors({
        selector: { id },
        data: { stripe_account_id: stripeAccountId },
      });

      const eventBus = req.scope.resolve("event_bus") as unknown as any;
      await eventBus.emit("vendor.stripe_connected", {
        vendor_id: id,
        stripe_account_id: stripeAccountId,
        tenant_id: vendor.tenant_id || "01KGZ2JRYX607FWMMYQNQRKVWS",
      });
    }

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url:
        refresh_url || `${appConfig.urls.storefront}/vendor/onboarding/refresh`,
      return_url:
        return_url || `${appConfig.urls.storefront}/vendor/onboarding/complete`,
      type: "account_onboarding",
    });

    res.json({
      onboarding_url: accountLink.url,
      stripe_account_id: stripeAccountId,
    });
  } catch (error: unknown) {
    handleApiError(res, error, "STORE-VENDORS-ID-STRIPE-CONNECT");
  }
}
