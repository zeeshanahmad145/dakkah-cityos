import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260213170010 extends Migration {

  override async up(): Promise<void> {
    // no-op: service_channel table is owned by the tenant module
    // (apps/backend/src/modules/tenant/models/service-channel.ts)
    // and created by tenant Migration20260216192031
  }

  override async down(): Promise<void> {
    // no-op: table managed by tenant module
  }

}
