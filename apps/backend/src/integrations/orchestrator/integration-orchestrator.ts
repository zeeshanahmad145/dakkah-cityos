import { MedusaContainer } from "@medusajs/framework/types";
import crypto from "crypto";
import { SyncTracker, SyncSystem, ISyncEntry } from "./sync-tracker";
import {
  IntegrationRegistry,
  createDefaultAdapters,
  IntegrationHealthStatus,
} from "./integration-registry";
import {
  DurableSyncTracker,
  durableSyncTracker,
} from "../../lib/platform/sync-tracker";
import { createLogger } from "../../lib/logger";
const logger = createLogger("integration:orchestrator");

export interface SyncOptions {
  correlation_id?: string;
  tenant_id?: string;
  node_id?: string;
  max_retries?: number;
  direction?: "inbound" | "outbound";
}

export interface SyncDashboard {
  stats: ReturnType<SyncTracker["getSyncStats"]>;
  recentSyncs: ISyncEntry[];
  failedSyncs: ISyncEntry[];
  health: IntegrationHealthStatus[];
}

export class IntegrationOrchestrator {
  private container: MedusaContainer;
  private tracker: SyncTracker;
  private registry: IntegrationRegistry;
  private durableTracker: DurableSyncTracker;

  constructor(
    container: MedusaContainer,
    tracker: SyncTracker,
    registry: IntegrationRegistry,
    durableTracker?: DurableSyncTracker,
  ) {
    this.container = container;
    this.tracker = tracker;
    this.registry = registry;
    this.durableTracker = durableTracker || durableSyncTracker;
  }

  async syncToSystem(
    system: SyncSystem,
    entityType: string,
    entityId: string,
    data: any,
    options: SyncOptions = {},
  ): Promise<ISyncEntry> {
    const payloadHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(data))
      .digest("hex");

    const entry = this.tracker.createSyncEntry({
      system,
      entity_type: entityType,
      entity_id: entityId,
      direction: options.direction ?? "outbound",
      payload_hash: payloadHash,
      correlation_id: options.correlation_id,
      tenant_id: options.tenant_id,
      node_id: options.node_id,
      max_retries: options.max_retries,
    });

    this.tracker.updateSyncStatus(entry.id, "in_progress");

    this.durableTracker
      .recordSync({
        system,
        entity_type: entityType,
        entity_id: entityId,
        direction: options.direction ?? "outbound",
        payload_hash: payloadHash,
        correlation_id: options.correlation_id || entry.correlation_id,
        tenant_id: options.tenant_id || "default",
      })
      .catch((err) =>
        logger.info(
          `[IntegrationOrchestrator] Durable tracking record error: ${err.message}`,
        ),
      );

    const adapter = this.registry.getAdapter(system);
    if (!adapter) {
      this.tracker.markFailed(
        entry.id,
        `No adapter registered for system: ${system}`,
      );
      return this.tracker.getRecentSyncs(1)[0] || entry;
    }

    if (!adapter.isConfigured()) {
      logger.info(
        `[IntegrationOrchestrator] System ${system} not configured, skipping sync`,
      );
      this.tracker.markFailed(
        entry.id,
        `System ${system} not configured (missing env vars)`,
      );
      return this.tracker.getRecentSyncs(1)[0] || entry;
    }

    try {
      const result = await adapter.syncEntity(entityType, entityId, data);
      if (result.success) {
        this.tracker.markSuccess(entry.id);
        this.durableTracker
          .updateStatus(entry.id, "completed")
          .catch((err) =>
            logger.info(
              `[IntegrationOrchestrator] Durable status update error: ${err.message}`,
            ),
          );
      } else {
        this.tracker.markFailed(entry.id, result.error || "Unknown sync error");
        this.durableTracker
          .updateStatus(
            entry.id,
            "failed",
            result.error || "Unknown sync error",
          )
          .catch((err) =>
            logger.info(
              `[IntegrationOrchestrator] Durable status update error: ${err.message}`,
            ),
          );
      }
    } catch (error: unknown) {
      logger.info(
        `[IntegrationOrchestrator] Sync error for ${system}/${entityType}/${entityId}: ${(error instanceof Error ? error.message : String(error))}`,
      );
      this.tracker.markFailed(entry.id, (error instanceof Error ? error.message : String(error)));
      this.durableTracker
        .updateStatus(entry.id, "failed", (error instanceof Error ? error.message : String(error)))
        .catch((err) =>
          logger.info(
            `[IntegrationOrchestrator] Durable status update error: ${err.message}`,
          ),
        );
    }

    return this.entries_get(entry.id) || entry;
  }

  async syncToAllSystems(
    entityType: string,
    entityId: string,
    data: any,
    options: SyncOptions = {},
  ): Promise<ISyncEntry[]> {
    const adapters = this.registry.getAllAdapters();
    const results: ISyncEntry[] = [];

    for (const adapter of adapters) {
      if (!adapter.isConfigured()) {
        logger.info(
          `[IntegrationOrchestrator] Skipping ${adapter.name} (not configured)`,
        );
        continue;
      }

      try {
        const entry = await this.syncToSystem(
          adapter.name as SyncSystem,
          entityType,
          entityId,
          data,
          options,
        );
        results.push(entry);
      } catch (error: unknown) {
        logger.info(
          `[IntegrationOrchestrator] Fan-out error for ${adapter.name}: ${(error instanceof Error ? error.message : String(error))}`,
        );
      }
    }

    return results;
  }

  async syncNodeHierarchy(tenantId: string): Promise<{
    synced: number;
    failed: number;
    errors: string[];
  }> {
    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    logger.info(
      `[IntegrationOrchestrator] Syncing node hierarchy for tenant: ${tenantId}`,
    );

    try {
      const query = this.container.resolve("query") as unknown as any;

      const { data: nodes } = await query.graph({
        entity: "node",
        fields: ["id", "name", "type", "parent_id", "metadata"],
        filters: { tenant_id: tenantId },
      });

      if (!nodes || nodes.length === 0) {
        logger.info(
          `[IntegrationOrchestrator] No nodes found for tenant: ${tenantId}`,
        );
        return { synced: 0, failed: 0, errors: [] };
      }

      for (const node of nodes) {
        try {
          await this.syncToAllSystems("node", node.id, node, {
            tenant_id: tenantId,
            node_id: node.id,
          });
          synced++;
        } catch (error: unknown) {
          failed++;
          errors.push(`Node ${node.id}: ${(error instanceof Error ? error.message : String(error))}`);
        }
      }
    } catch (error: unknown) {
      logger.info(
        `[IntegrationOrchestrator] Node hierarchy sync error: ${(error instanceof Error ? error.message : String(error))}`,
      );
      errors.push(`Hierarchy sync error: ${(error instanceof Error ? error.message : String(error))}`);
    }

    logger.info(
      `[IntegrationOrchestrator] Node hierarchy sync complete: ${synced} synced, ${failed} failed`,
    );
    return { synced, failed, errors };
  }

  async handleInboundWebhook(
    system: SyncSystem,
    event: string,
    payload: any,
  ): Promise<{ processed: boolean; syncEntry?: ISyncEntry; error?: string }> {
    const entry = this.tracker.createSyncEntry({
      system,
      entity_type: event,
      entity_id: payload?.id || "unknown",
      direction: "inbound",
      correlation_id: payload?.correlation_id,
    });

    this.tracker.updateSyncStatus(entry.id, "in_progress");

    this.durableTracker
      .recordSync({
        system,
        entity_type: event,
        entity_id: payload?.id || "unknown",
        direction: "inbound",
        correlation_id: payload?.correlation_id || entry.correlation_id,
        tenant_id: payload?.tenant_id || "default",
      })
      .catch((err) =>
        logger.info(
          `[IntegrationOrchestrator] Durable tracking record error: ${err.message}`,
        ),
      );

    const adapter = this.registry.getAdapter(system);
    if (!adapter) {
      this.tracker.markFailed(entry.id, `No adapter for system: ${system}`);
      return {
        processed: false,
        syncEntry: this.entries_get(entry.id) || entry,
        error: `No adapter for system: ${system}`,
      };
    }

    try {
      const result = await adapter.handleWebhook(event, payload);
      if (result.processed) {
        this.tracker.markSuccess(entry.id);
      } else {
        this.tracker.markFailed(
          entry.id,
          result.error || "Webhook not processed",
        );
      }
      return {
        processed: result.processed,
        syncEntry: this.entries_get(entry.id) || entry,
        error: result.error,
      };
    } catch (error: unknown) {
      logger.info(
        `[IntegrationOrchestrator] Webhook error from ${system}: ${(error instanceof Error ? error.message : String(error))}`,
      );
      this.tracker.markFailed(entry.id, (error instanceof Error ? error.message : String(error)));
      return {
        processed: false,
        syncEntry: this.entries_get(entry.id) || entry,
        error: (error instanceof Error ? error.message : String(error)),
      };
    }
  }

  async retryFailedSyncs(): Promise<{
    retried: number;
    succeeded: number;
    failed: number;
    errors: string[];
  }> {
    const failedSyncs = this.tracker.getFailedSyncs();
    let retried = 0;
    let succeeded = 0;
    let failedCount = 0;
    const errors: string[] = [];

    logger.info(
      `[IntegrationOrchestrator] Retrying ${failedSyncs.length} failed syncs`,
    );

    for (const entry of failedSyncs) {
      retried++;
      this.tracker.updateSyncStatus(entry.id, "retrying");

      const adapter = this.registry.getAdapter(entry.system);
      if (!adapter || !adapter.isConfigured()) {
        this.tracker.markFailed(
          entry.id,
          `Adapter ${entry.system} not available for retry`,
        );
        failedCount++;
        errors.push(`${entry.id}: adapter not available`);
        continue;
      }

      try {
        const result = await adapter.syncEntity(
          entry.entity_type,
          entry.entity_id,
          {},
        );
        if (result.success) {
          this.tracker.markSuccess(entry.id);
          succeeded++;
        } else {
          this.tracker.markFailed(entry.id, result.error || "Retry failed");
          failedCount++;
          errors.push(`${entry.id}: ${result.error}`);
        }
      } catch (error: unknown) {
        this.tracker.markFailed(entry.id, (error instanceof Error ? error.message : String(error)));
        failedCount++;
        errors.push(`${entry.id}: ${(error instanceof Error ? error.message : String(error))}`);
      }
    }

    logger.info(
      `[IntegrationOrchestrator] Retry complete: ${succeeded} succeeded, ${failedCount} failed out of ${retried} retried`,
    );
    return { retried, succeeded, failed: failedCount, errors };
  }

  async getIntegrationHealth(): Promise<IntegrationHealthStatus[]> {
    return this.registry.getHealthStatus();
  }

  async getSyncDashboard(): Promise<SyncDashboard> {
    const [stats, recentSyncs, failedSyncs, health] = await Promise.all([
      Promise.resolve(this.tracker.getSyncStats()),
      Promise.resolve(this.tracker.getRecentSyncs(20)),
      Promise.resolve(this.tracker.getFailedSyncs()),
      this.registry.getHealthStatus(),
    ]);

    return { stats, recentSyncs, failedSyncs, health };
  }

  private entries_get(id: string): ISyncEntry | undefined {
    return this.tracker.getRecentSyncs(1000).find((e) => e.id === id);
  }
}

export function createIntegrationOrchestrator(
  container: MedusaContainer,
): IntegrationOrchestrator {
  const tracker = new SyncTracker(container);
  const registry = new IntegrationRegistry();

  const defaultAdapters = createDefaultAdapters();
  for (const adapter of defaultAdapters) {
    registry.registerAdapter(adapter);
  }

  logger.info(
    "[IntegrationOrchestrator] Orchestrator initialized with default adapters and durable sync tracking",
  );
  return new IntegrationOrchestrator(
    container,
    tracker,
    registry,
    durableSyncTracker,
  );
}
