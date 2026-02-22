import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260220000003 extends Migration {
  override async up(): Promise<void> {
    // no-op: insurance tables (ins_policy, ins_claim) are created by
    // Migration20260601000001 with the correct table names matching the models.
    // This migration previously used mismatched table names (insurance_policy,
    // insurance_claim) that conflict with the tenant module's schema.
  }

  override async down(): Promise<void> {
    // no-op: tables managed by Migration20260601000001
  }
}
