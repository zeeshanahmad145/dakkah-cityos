import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260213180002 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "wishlist" ("id" text not null, "customer_id" text not null, "tenant_id" text not null, "title" text not null default 'My Wishlist', "is_default" boolean not null default false, "visibility" text check ("visibility" in ('private', 'shared', 'public')) not null default 'private', "share_token" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "wishlist_pkey" primary key ("id"));`);
    this.addSql(`ALTER TABLE "wishlist" ADD COLUMN IF NOT EXISTS "title" text null default 'My Wishlist';`);
    this.addSql(`ALTER TABLE "wishlist" ADD COLUMN IF NOT EXISTS "visibility" text null default 'private';`);
    this.addSql(`ALTER TABLE "wishlist" ADD COLUMN IF NOT EXISTS "share_token" text null;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_wishlist_deleted_at" ON "wishlist" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_wishlist_tenant_id" ON "wishlist" ("tenant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_wishlist_customer_id" ON "wishlist" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_wishlist_is_default" ON "wishlist" ("is_default") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_wishlist_visibility" ON "wishlist" ("visibility") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_wishlist_share_token" ON "wishlist" ("share_token") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "wishlist_item" ("id" text not null, "wishlist_id" text not null, "product_id" text not null, "variant_id" text null, "added_at" timestamptz not null, "priority" text not null default 'medium', "notes" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "wishlist_item_pkey" primary key ("id"));`);
    this.addSql(`ALTER TABLE "wishlist_item" ADD COLUMN IF NOT EXISTS "added_at" timestamptz null;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_wishlist_item_deleted_at" ON "wishlist_item" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_wishlist_item_wishlist_id" ON "wishlist_item" ("wishlist_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_wishlist_item_product_id" ON "wishlist_item" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_wishlist_item_variant_id" ON "wishlist_item" ("variant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_wishlist_item_priority" ON "wishlist_item" ("priority") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "wishlist" cascade;`);

    this.addSql(`drop table if exists "wishlist_item" cascade;`);
  }

}
