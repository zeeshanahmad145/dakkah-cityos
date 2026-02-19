import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260601000002 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "trade_in_request" ("id" text not null, "customer_id" text not null, "product_id" text not null, "condition" text check ("condition" in ('excellent', 'good', 'fair', 'poor')) not null, "description" text not null, "photos" jsonb not null default '{}', "status" text check ("status" in ('submitted', 'evaluated', 'approved', 'rejected', 'completed')) not null default 'submitted', "trade_in_number" text not null, "estimated_value" numeric null, "final_value" numeric null, "credit_amount" numeric null, "evaluation_notes" text null, "rejection_reason" text null, "submitted_at" timestamptz null, "evaluated_at" timestamptz null, "approved_at" timestamptz null, "rejected_at" timestamptz null, "completed_at" timestamptz null, "metadata" jsonb null, "raw_estimated_value" jsonb null, "raw_final_value" jsonb null, "raw_credit_amount" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "trade_in_request_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_trade_in_request_deleted_at" ON "trade_in_request" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_trade_in_request_customer_id" ON "trade_in_request" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_trade_in_request_product_id" ON "trade_in_request" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_trade_in_request_status" ON "trade_in_request" ("status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_trade_in_request_trade_in_number" ON "trade_in_request" ("trade_in_number") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "trade_in_offer" ("id" text not null, "request_id" text not null, "offer_amount" numeric not null, "credit_type" text check ("credit_type" in ('store_credit', 'wallet', 'refund')) not null default 'store_credit', "expires_at" timestamptz null, "status" text check ("status" in ('pending', 'accepted', 'rejected', 'expired')) not null default 'pending', "metadata" jsonb null, "raw_offer_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "trade_in_offer_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_trade_in_offer_deleted_at" ON "trade_in_offer" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_trade_in_offer_request_id" ON "trade_in_offer" ("request_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_trade_in_offer_status" ON "trade_in_offer" ("status") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "trade_in_request" cascade;`);

    this.addSql(`drop table if exists "trade_in_offer" cascade;`);
  }

}
