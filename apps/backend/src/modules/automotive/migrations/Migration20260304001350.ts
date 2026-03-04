import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260304001350 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "vehicle_listing" drop column if exists "title", drop column if exists "price", drop column if exists "currency_code", drop column if exists "description", drop column if exists "images", drop column if exists "status", drop column if exists "raw_price";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "vehicle_listing" add column if not exists "title" text not null, add column if not exists "price" numeric not null, add column if not exists "currency_code" text not null, add column if not exists "description" text null, add column if not exists "images" jsonb null, add column if not exists "status" text check ("status" in ('draft', 'active', 'reserved', 'sold', 'withdrawn')) not null default 'draft', add column if not exists "raw_price" jsonb not null;`);
  }

}
