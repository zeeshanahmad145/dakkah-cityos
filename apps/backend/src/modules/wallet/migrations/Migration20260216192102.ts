import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260216192102 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "wallet" ("id" text not null, "customer_id" text not null, "currency" text not null default 'usd', "balance" numeric not null default 0, "version" integer not null default 1, "status" text check ("status" in ('active', 'frozen', 'closed')) not null default 'active', "freeze_reason" text null, "frozen_at" timestamptz null, "metadata" jsonb null, "raw_balance" jsonb not null default '{"value":"0","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "wallet_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_wallet_deleted_at" ON "wallet" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "wallet_transaction" ("id" text not null, "wallet_id" text not null, "type" text check ("type" in ('credit', 'debit')) not null, "amount" numeric not null, "balance_after" numeric not null, "description" text null, "reference_id" text null, "metadata" jsonb null, "raw_amount" jsonb not null, "raw_balance_after" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "wallet_transaction_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_wallet_transaction_deleted_at" ON "wallet_transaction" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "wallet" cascade;`);

    this.addSql(`drop table if exists "wallet_transaction" cascade;`);
  }

}
