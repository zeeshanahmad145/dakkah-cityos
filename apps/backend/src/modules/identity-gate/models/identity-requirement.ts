import { model } from "@medusajs/framework/utils";

/**
 * IdentityRequirement — defines which credential is required to purchase a product type.
 * Enforced at checkout via the /store/identity/verify-checkout API.
 *
 * Examples:
 *   - product_type: "alcohol"  → required_credential_type: "age_21"
 *   - product_type: "financial" → required_credential_type: "kyc_verified"
 *   - product_type: "pharmacy" → required_credential_type: "prescription"
 *   - product_type: "professional_tool" → required_credential_type: "trade_license"
 */
const IdentityRequirement = model.define("identity_requirement", {
  id: model.id().primaryKey(),
  // The commerce product type tag that triggers this rule
  product_type: model.text(),
  // The credential type the buyer must hold (verified against walt.id or fallback)
  required_credential_type: model.enum([
    "age_18",
    "age_21",
    "kyc_verified",
    "prescription",
    "trade_license",
    "professional_license",
    "government_id",
    "residency",
    "student_id",
  ]),
  // Which provider to check the VP against: "walt_id" | "internal"
  verification_provider: model.text().default("walt_id"),
  // If false, shows a warning but doesn't block checkout (soft gate)
  is_hard_gate: model.boolean().default(true),
  // Error message shown to buyer if rejected
  rejection_message: model.text().nullable(),
  is_active: model.boolean().default(true),
  tenant_id: model.text().nullable(),
});

export { IdentityRequirement };
