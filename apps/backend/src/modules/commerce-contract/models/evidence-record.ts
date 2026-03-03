import { model } from "@medusajs/framework/utils";

/**
 * EvidenceRecord — Normalized verification evidence attached to contracts, obligations,
 * fulfillment legs, and disputes.
 *
 * Used to prove fulfillment conditions are met before releasing escrow,
 * approving refunds, or resolving disputes.
 *
 * evidence_type:
 *   photo              — delivery/condition photo
 *   signature          — digital or wet signature
 *   gps_proof          — GPS coordinates + timestamp proving location
 *   checklist          — completed inspection checklist (JSON array of items)
 *   device_attestation — hardware attestation (mobile, IoT sensor)
 *   document           — uploaded contract, permit, certificate
 *   biometric          — face/fingerprint match confirmation
 *   blockchain_proof   — on-chain transaction hash
 */
const EvidenceRecord = model.define("evidence_record", {
  id: model.id().primaryKey(),

  // What this evidence is attached to
  entity_type: model.text(), // "obligation" | "contract" | "fulfillment_leg" | "dispute" | "rma"
  entity_id: model.text(),

  // Evidence classification
  evidence_type: model.enum([
    "photo",
    "signature",
    "gps_proof",
    "checklist",
    "device_attestation",
    "document",
    "biometric",
    "blockchain_proof",
  ]),

  // Storage
  storage_url: model.text().nullable(), // S3 / CDN URL for photo/document/signature
  storage_hash: model.text().nullable(), // SHA-256 hash of the file for integrity verification

  // Structured payload (for gps_proof, checklist, device_attestation, blockchain_proof)
  payload: model.json().nullable(),
  // gps_proof:          { lat, lng, accuracy_meters, altitude?, speed? }
  // checklist:          { items: [{ label, checked, notes? }], completed_by }
  // device_attestation: { device_id, attestation_token, platform, app_version }
  // blockchain_proof:   { chain, tx_hash, block_number, contract_address? }

  // Provenance
  captured_at: model.dateTime(),
  captured_by_type: model.text().nullable(), // "customer" | "vendor" | "system" | "inspector"
  captured_by_id: model.text().nullable(),

  // Validation status (may be verified by AI or manual review)
  validation_status: model
    .enum(["pending", "accepted", "rejected", "requires_review"])
    .default("pending"),
  validation_notes: model.text().nullable(),
  validated_at: model.dateTime().nullable(),
  validated_by: model.text().nullable(),

  tenant_id: model.text().nullable(),
  metadata: model.json().nullable(),
});

export { EvidenceRecord };
