import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260216192031 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "tenant_relationship" drop constraint if exists "tenant_relationship_host_tenant_id_vendor_tenant_id_unique";`);
    this.addSql(`create table if not exists "service_channel" ("id" text not null, "tenant_id" text not null, "poi_id" text null, "name" text not null, "slug" text not null, "channel_type" text check ("channel_type" in ('in_store', 'online', 'delivery', 'pickup', 'drive_through', 'curbside', 'appointment', 'telemedicine', 'home_service', 'subscription_box', 'wholesale', 'auction', 'rental')) not null default 'online', "is_active" boolean not null default true, "capabilities" jsonb null, "operating_hours" jsonb null, "fulfillment_type" text check ("fulfillment_type" in ('instant', 'scheduled', 'on_demand', 'standard', 'custom')) not null default 'standard', "min_order_amount" numeric null, "max_order_amount" numeric null, "delivery_fee" numeric null, "supported_payment_methods" jsonb null, "priority" integer not null default 0, "metadata" jsonb null, "raw_min_order_amount" jsonb null, "raw_max_order_amount" jsonb null, "raw_delivery_fee" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "service_channel_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_service_channel_deleted_at" ON "service_channel" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_service_channel_tenant_id" ON "service_channel" ("tenant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_service_channel_poi_id" ON "service_channel" ("poi_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_service_channel_channel_type" ON "service_channel" ("channel_type") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "tenant_poi" ("id" text not null, "tenant_id" text not null, "node_id" text null, "name" text not null, "slug" text not null, "poi_type" text check ("poi_type" in ('storefront', 'warehouse', 'fulfillment_hub', 'service_point', 'office', 'branch', 'kiosk', 'mobile')) not null default 'storefront', "address_line1" text not null, "address_line2" text null, "city" text not null, "state" text null, "postal_code" text not null, "country_code" text not null, "latitude" integer null, "longitude" integer null, "geohash" text null, "operating_hours" jsonb null, "phone" text null, "email" text null, "is_primary" boolean not null default false, "is_active" boolean not null default true, "service_radius_km" integer null, "delivery_zones" jsonb null, "fleetbase_place_id" text null, "media" jsonb null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "tenant_poi_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_tenant_poi_deleted_at" ON "tenant_poi" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_tenant_poi_tenant_id" ON "tenant_poi" ("tenant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_tenant_poi_node_id" ON "tenant_poi" ("node_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_tenant_poi_country_code" ON "tenant_poi" ("country_code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_tenant_poi_tenant_id_is_primary" ON "tenant_poi" ("tenant_id", "is_primary") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "tenant_relationship" ("id" text not null, "host_tenant_id" text not null, "vendor_tenant_id" text not null, "relationship_type" text check ("relationship_type" in ('marketplace_vendor', 'franchise', 'affiliate', 'white_label', 'partnership')) not null default 'marketplace_vendor', "status" text check ("status" in ('pending', 'active', 'suspended', 'terminated')) not null default 'pending', "commission_type" text check ("commission_type" in ('percentage', 'flat', 'tiered', 'custom')) not null default 'percentage', "commission_rate" integer null, "commission_flat" numeric null, "commission_tiers" jsonb null, "listing_scope" text check ("listing_scope" in ('all', 'approved_only', 'category_restricted', 'manual')) not null default 'approved_only', "allowed_categories" jsonb null, "revenue_share_model" jsonb null, "contract_start" timestamptz null, "contract_end" timestamptz null, "approved_by" text null, "approved_at" timestamptz null, "terms" jsonb null, "metadata" jsonb null, "raw_commission_flat" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "tenant_relationship_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_tenant_relationship_deleted_at" ON "tenant_relationship" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_tenant_relationship_host_tenant_id" ON "tenant_relationship" ("host_tenant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_tenant_relationship_vendor_tenant_id" ON "tenant_relationship" ("vendor_tenant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_tenant_relationship_host_tenant_id_vendor_tenant_id_unique" ON "tenant_relationship" ("host_tenant_id", "vendor_tenant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_tenant_relationship_status" ON "tenant_relationship" ("status") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "tenant" add column if not exists "scope_tier" text check ("scope_tier" in ('nano', 'micro', 'small', 'medium', 'large', 'mega', 'global')) not null default 'nano', add column if not exists "tenant_type" text check ("tenant_type" in ('platform', 'marketplace', 'vendor', 'brand')) not null default 'vendor', add column if not exists "parent_tenant_id" text null, add column if not exists "operating_countries" jsonb null, add column if not exists "max_pois" integer not null default 1, add column if not exists "max_channels" integer not null default 1, add column if not exists "can_host_vendors" boolean not null default false;`);
    this.addSql(`alter table if exists "tenant" alter column "supported_locales" type jsonb using ("supported_locales"::jsonb);`);
    this.addSql(`alter table if exists "tenant" alter column "supported_locales" set default '{"locales":["en"]}';`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "service_channel" cascade;`);

    this.addSql(`drop table if exists "tenant_poi" cascade;`);

    this.addSql(`drop table if exists "tenant_relationship" cascade;`);

    this.addSql(`alter table if exists "tenant" drop column if exists "scope_tier", drop column if exists "tenant_type", drop column if exists "parent_tenant_id", drop column if exists "operating_countries", drop column if exists "max_pois", drop column if exists "max_channels", drop column if exists "can_host_vendors";`);

    this.addSql(`alter table if exists "tenant" alter column "supported_locales" type jsonb using ("supported_locales"::jsonb);`);
    this.addSql(`alter table if exists "tenant" alter column "supported_locales" set default '["en"]';`);
  }

}
