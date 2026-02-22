import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260216192050 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "loyalty_account" ("id" text not null, "program_id" text not null, "customer_id" text not null, "tenant_id" text not null, "points_balance" numeric not null default 0, "lifetime_points" numeric not null default 0, "tier" text null, "tier_expires_at" timestamptz null, "status" text not null default 'active', "metadata" jsonb null, "raw_points_balance" jsonb not null default '{"value":"0","precision":20}', "raw_lifetime_points" jsonb not null default '{"value":"0","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "loyalty_account_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_loyalty_account_deleted_at" ON "loyalty_account" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "loyalty_program" ("id" text not null, "tenant_id" text not null, "name" text not null, "description" text null, "points_per_currency" integer not null default 1, "currency_code" text not null, "status" text not null default 'active', "tiers" jsonb null, "earn_rules" jsonb null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "loyalty_program_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_loyalty_program_deleted_at" ON "loyalty_program" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "point_transaction" ("id" text not null, "account_id" text not null, "tenant_id" text not null, "type" text not null, "points" numeric not null, "balance_after" numeric not null, "reference_type" text null, "reference_id" text null, "description" text null, "expires_at" timestamptz null, "metadata" jsonb null, "raw_points" jsonb not null, "raw_balance_after" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "point_transaction_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_point_transaction_deleted_at" ON "point_transaction" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "loyalty_account" cascade;`);

    this.addSql(`drop table if exists "loyalty_program" cascade;`);

    this.addSql(`drop table if exists "point_transaction" cascade;`);
  }

}
