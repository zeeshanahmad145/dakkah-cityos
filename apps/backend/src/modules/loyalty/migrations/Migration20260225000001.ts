import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260225000001 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`ALTER TABLE IF EXISTS "loyalty_program" ADD COLUMN IF NOT EXISTS "status" text not null default 'active';`);

    this.addSql(`ALTER TABLE IF EXISTS "loyalty_account" ALTER COLUMN "points_balance" TYPE numeric USING "points_balance"::numeric;`);
    this.addSql(`ALTER TABLE IF EXISTS "loyalty_account" ALTER COLUMN "lifetime_points" TYPE numeric USING "lifetime_points"::numeric;`);
    this.addSql(`ALTER TABLE IF EXISTS "loyalty_account" ADD COLUMN IF NOT EXISTS "raw_points_balance" jsonb not null default '{"value":"0","precision":20}';`);
    this.addSql(`ALTER TABLE IF EXISTS "loyalty_account" ADD COLUMN IF NOT EXISTS "raw_lifetime_points" jsonb not null default '{"value":"0","precision":20}';`);
  }

  override async down(): Promise<void> {
    this.addSql(`ALTER TABLE IF EXISTS "loyalty_program" DROP COLUMN IF EXISTS "status";`);
    this.addSql(`ALTER TABLE IF EXISTS "loyalty_account" DROP COLUMN IF EXISTS "raw_points_balance";`);
    this.addSql(`ALTER TABLE IF EXISTS "loyalty_account" DROP COLUMN IF EXISTS "raw_lifetime_points";`);
    this.addSql(`ALTER TABLE IF EXISTS "loyalty_account" ALTER COLUMN "points_balance" TYPE integer USING "points_balance"::integer;`);
    this.addSql(`ALTER TABLE IF EXISTS "loyalty_account" ALTER COLUMN "lifetime_points" TYPE integer USING "lifetime_points"::integer;`);
  }

}
