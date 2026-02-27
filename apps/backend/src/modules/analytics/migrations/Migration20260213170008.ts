import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260213170008 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "analytics_event" ("id" text not null, "tenant_id" text not null, "event_type" text not null, "entity_type" text null, "entity_id" text null, "customer_id" text null, "session_id" text null, "properties" jsonb null, "revenue" numeric null, "currency" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "analytics_event_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_analytics_event_deleted_at" ON "analytics_event" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_analytics_event_tenant_id" ON "analytics_event" ("tenant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_analytics_event_event_type" ON "analytics_event" ("event_type") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_analytics_event_customer_id" ON "analytics_event" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_analytics_event_entity_type" ON "analytics_event" ("entity_type") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "dashboard" ("id" text not null, "tenant_id" text not null, "name" text not null, "slug" text not null, "widgets" jsonb null, "layout" jsonb null, "is_default" boolean not null default false, "role_access" jsonb null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "dashboard_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dashboard_deleted_at" ON "dashboard" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dashboard_tenant_id" ON "dashboard" ("tenant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dashboard_slug" ON "dashboard" ("slug") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dashboard_is_default" ON "dashboard" ("is_default") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "report" ("id" text not null, "tenant_id" text not null, "name" text not null, "slug" text not null, "report_type" text null, "date_range_type" text null, "filters" jsonb null, "schedule" jsonb null, "last_generated" timestamptz null, "is_public" boolean not null default false, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "report_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_report_deleted_at" ON "report" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_report_tenant_id" ON "report" ("tenant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_report_slug" ON "report" ("slug") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_report_report_type" ON "report" ("report_type") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_report_is_public" ON "report" ("is_public") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "analytics_event" cascade;`);

    this.addSql(`drop table if exists "dashboard" cascade;`);

    this.addSql(`drop table if exists "report" cascade;`);
  }

}
