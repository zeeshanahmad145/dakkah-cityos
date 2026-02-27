import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260227120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "analytics_event" ("id" text not null, "tenant_id" text not null, "event_type" text not null, "entity_type" text null, "entity_id" text null, "customer_id" text null, "session_id" text null, "properties" jsonb null, "revenue" numeric null, "currency" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "analytics_event_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_analytics_event_deleted_at" ON "analytics_event" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_analytics_event_tenant_id" ON "analytics_event" ("tenant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_analytics_event_event_type" ON "analytics_event" ("event_type") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_analytics_event_customer_id" ON "analytics_event" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_analytics_event_entity_type" ON "analytics_event" ("entity_type") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "analytics_event" cascade;`);
  }

}
