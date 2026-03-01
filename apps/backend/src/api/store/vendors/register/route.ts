// @ts-nocheck
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const vendorRegisterSchema = z.object({
  company_name: z.string().min(1),
  business_email: z.string().min(1),
  phone: z.string().optional(),
  website: z.string().optional(),
  description: z.string().optional(),
  business_type: z.string().optional(),
  tax_id: z.string().optional(),
  address: z.record(z.string(), z.unknown()).optional(),
  bank_account: z.record(z.string(), z.unknown()).optional(),
  contact_person: z.record(z.string(), z.unknown()).optional(),
  product_categories: z.array(z.string()).optional(),
  expected_volume: z.string().optional(),
  existing_sales_channels: z.array(z.string()).optional(),
  agree_to_terms: z.literal(true),
});

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id;
  if (!customerId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const parsed = vendorRegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.issues });
  }

  const {
    company_name,
    business_email,
    phone,
    website,
    description,
    business_type,
    tax_id,
    address,
    bank_account,
    contact_person,
    product_categories,
    expected_volume,
    existing_sales_channels,
    agree_to_terms,
  } = parsed.data;

  const vendorModule = req.scope.resolve("vendor") as unknown as any;

  try {
    const handle = company_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const existingVendors = await vendorModule.listVendors({ handle });
    if (existingVendors.length > 0) {
      return res
        .status(400)
        .json({ message: "A vendor with this name already exists" });
    }

    const vendor = await vendorModule.createVendors({
      name: company_name,
      handle,
      email: business_email,
      phone,
      website,
      description,
      status: "pending",
      verification_status: "pending",
      metadata: {
        business_type,
        tax_id,
        address,
        bank_account,
        contact_person,
        product_categories,
        expected_volume,
        existing_sales_channels,
        application_date: new Date().toISOString(),
      },
    });

    const eventBus = req.scope.resolve("event_bus") as unknown as any;
    await eventBus.emit("vendor.application_submitted", {
      vendor_id: vendor.id,
      company_name,
      business_email,
    });

    res.status(201).json({
      success: true,
      vendor: {
        id: vendor.id,
        name: vendor.name,
        handle: vendor.handle,
        status: vendor.status,
      },
      message:
        "Your vendor application has been submitted. We'll review it within 2-3 business days.",
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-VENDORS-REGISTER");
  }
}
