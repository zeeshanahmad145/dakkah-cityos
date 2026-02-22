import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260601000001 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "ins_policy" ("id" text not null, "customer_id" text not null, "product_id" text not null, "order_id" text null, "plan_type" text not null, "coverage_amount" numeric not null, "premium" numeric not null, "start_date" timestamptz not null, "end_date" timestamptz not null, "status" text check ("status" in ('active', 'expired', 'cancelled', 'claimed')) not null default 'active', "policy_number" text not null, "cancellation_reason" text null, "cancelled_at" timestamptz null, "metadata" jsonb null, "raw_coverage_amount" jsonb not null, "raw_premium" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ins_policy_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ins_policy_deleted_at" ON "ins_policy" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ins_policy_customer_id" ON "ins_policy" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ins_policy_product_id" ON "ins_policy" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ins_policy_order_id" ON "ins_policy" ("order_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ins_policy_status" ON "ins_policy" ("status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ins_policy_policy_number" ON "ins_policy" ("policy_number") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "ins_claim" ("id" text not null, "policy_id" text not null, "claim_type" text null, "claim_amount" numeric not null, "description" text not null, "evidence" jsonb null, "status" text check ("status" in ('pending', 'under_review', 'approved', 'rejected')) not null default 'pending', "claim_number" text not null, "decision_notes" text null, "payout_amount" numeric null, "filed_at" timestamptz null, "decided_at" timestamptz null, "metadata" jsonb null, "raw_claim_amount" jsonb not null, "raw_payout_amount" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ins_claim_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ins_claim_deleted_at" ON "ins_claim" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ins_claim_policy_id" ON "ins_claim" ("policy_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ins_claim_status" ON "ins_claim" ("status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ins_claim_claim_number" ON "ins_claim" ("claim_number") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "ins_policy" cascade;`);

    this.addSql(`drop table if exists "ins_claim" cascade;`);
  }

}
