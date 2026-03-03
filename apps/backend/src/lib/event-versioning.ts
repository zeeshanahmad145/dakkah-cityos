import { z } from "zod";
import { createLogger } from "./logger";

const logger = createLogger("lib:event-versioning");

/**
 * EventSchemaRegistry — Versioned event schema enforcement + replay-safe migrations.
 *
 * Every domain event is versioned. When the schema changes, migration functions
 * transform old events to new shapes. This allows the entire commerce economy
 * to be rebuilt from events at any point in time ("rebuild economy" capability).
 *
 * Usage:
 *   const reg = EventSchemaRegistry.getInstance()
 *   reg.register("offer.created", 1, offerCreatedV1Schema)
 *   reg.register("offer.created", 2, offerCreatedV2Schema, (v1) => migrateToV2(v1))
 *   reg.validate({ event: "offer.created", version: 2, payload: {...} })
 *   reg.migrate({ event: "offer.created", version: 1, payload: {...} }, 2)
 */

export type VersionedEvent<T = unknown> = {
  event: string;
  version: number;
  schema_id?: string;
  payload: T;
  occurred_at?: string;
  idempotency_key?: string;
  contract_id?: string; // CRITICAL: enables replay-by-contract
  trace_id?: string;
};

type MigrationFn = (event: VersionedEvent) => VersionedEvent;

type SchemaEntry = {
  schema: z.ZodTypeAny;
  migration?: MigrationFn; // migration FROM previous version to this version
};

export class EventSchemaRegistry {
  private static instance: EventSchemaRegistry;
  private schemas: Map<string, Map<number, SchemaEntry>> = new Map();

  static getInstance(): EventSchemaRegistry {
    if (!EventSchemaRegistry.instance) {
      EventSchemaRegistry.instance = new EventSchemaRegistry();
      EventSchemaRegistry.instance._registerBuiltinSchemas();
    }
    return EventSchemaRegistry.instance;
  }

  /**
   * Register a versioned schema. Optionally provide a migration function
   * that converts an event from (version - 1) to this version.
   */
  register(
    eventName: string,
    version: number,
    schema: z.ZodTypeAny,
    migration?: MigrationFn,
  ): void {
    if (!this.schemas.has(eventName)) this.schemas.set(eventName, new Map());
    this.schemas.get(eventName)!.set(version, { schema, migration });
    logger.info(`EventSchema registered: ${eventName} v${version}`);
  }

  /**
   * Validate an event against its registered schema.
   * Throws if invalid or unregistered.
   */
  validate(event: VersionedEvent): void {
    const versions = this.schemas.get(event.event);
    if (!versions)
      throw new Error(`No schema registered for event: ${event.event}`);
    const entry = versions.get(event.version);
    if (!entry)
      throw new Error(`No schema for ${event.event} v${event.version}`);
    const result = entry.schema.safeParse(event.payload);
    if (!result.success) {
      throw new Error(
        `Event validation failed: ${event.event} v${event.version} — ${JSON.stringify(result.error.issues)}`,
      );
    }
  }

  /**
   * Migrate an event from its current version to a target version.
   * Applies migrations sequentially (1→2→3...) up to targetVersion.
   */
  migrate(event: VersionedEvent, targetVersion: number): VersionedEvent {
    let current = { ...event };
    const versions = this.schemas.get(event.event);
    if (!versions) return current;

    for (let v = event.version + 1; v <= targetVersion; v++) {
      const entry = versions.get(v);
      if (entry?.migration) {
        current = entry.migration(current);
        current = { ...current, version: v };
        logger.info(`Migrated ${event.event} v${v - 1} → v${v}`);
      }
    }
    return current;
  }

  /**
   * Replay all events for a contract_id to rebuild state.
   * Returns ordered event chain for deterministic replay.
   */
  replayByContractId(
    contractId: string,
    eventStore: VersionedEvent[],
  ): VersionedEvent[] {
    const events = eventStore
      .filter((e) => e.contract_id === contractId)
      .sort(
        (a, b) =>
          new Date(a.occurred_at ?? 0).getTime() -
          new Date(b.occurred_at ?? 0).getTime(),
      );

    const latestVersions: Record<string, number> = {};
    for (const [name, versions] of this.schemas.entries()) {
      latestVersions[name] = Math.max(...versions.keys());
    }

    return events.map((e) => {
      const target = latestVersions[e.event];
      return target && target > e.version ? this.migrate(e, target) : e;
    });
  }

  latestVersion(eventName: string): number {
    const versions = this.schemas.get(eventName);
    if (!versions || versions.size === 0) return 1;
    return Math.max(...versions.keys());
  }

  /**
   * Built-in kernel event schemas for all canonical commerce events.
   */
  private _registerBuiltinSchemas(): void {
    // offer.created
    this.register(
      "offer.created",
      1,
      z.object({
        offer_id: z.string(),
        offer_type: z.enum([
          "good",
          "service",
          "right",
          "access",
          "license",
          "usage",
        ]),
        monetization_model: z.enum([
          "one_time",
          "recurring",
          "usage",
          "milestone",
          "escrow",
          "auction",
        ]),
        source_module: z.string(),
        source_entity_id: z.string(),
        base_price: z.number(),
        currency_code: z.string(),
      }),
    );

    // commerce_state.transitioned
    this.register(
      "commerce_state.transitioned",
      1,
      z.object({
        entity_type: z.string(),
        entity_id: z.string(),
        from_state: z.string().nullable(),
        to_state: z.string(),
        actor_type: z.string(),
        actor_id: z.string().nullable(),
        reason: z.string().nullable(),
      }),
    );

    // ledger.journal_posted
    this.register(
      "ledger.journal_posted",
      1,
      z.object({
        journal_id: z.string(),
        entry_count: z.number(),
        total_debit: z.number(),
        total_credit: z.number(),
        reference_type: z.string().nullable(),
        reference_id: z.string().nullable(),
      }),
    );

    // settlement.line_created
    this.register(
      "settlement.line_created",
      1,
      z.object({
        settlement_id: z.string(),
        line_type: z.string(),
        party_id: z.string().nullable(),
        amount: z.number(),
        currency_code: z.string(),
      }),
    );

    // freeze.created
    this.register(
      "freeze.created",
      1,
      z.object({
        freeze_record_id: z.string(),
        scope_type: z.string(),
        scope_id: z.string(),
        freeze_reason: z.string(),
        release_condition: z.string(),
      }),
    );

    // obligation.breached
    this.register(
      "obligation.breached",
      1,
      z.object({
        obligation_id: z.string(),
        contract_id: z.string(),
        party_role: z.string(),
        action: z.string(),
        breach_action: z.string().nullable(),
        breach_penalty_amount: z.number().nullable(),
      }),
    );
  }
}

export const eventRegistry = EventSchemaRegistry.getInstance();
