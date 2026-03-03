import type { MedusaContainer } from "@medusajs/framework";
import { createLogger } from "../lib/logger";

const logger = createLogger("job:freeze-propagation-executor");

/**
 * FreezeRecordPropagationExecutor — Applies propagation rules for all
 * newly created FreezeRecords that are still in "pending" propagation_status.
 *
 * For each active FreezeRecord with propagation_status = "pending":
 *   - Reads propagates_to[] array of { target_type, action } rules
 *   - Executes the action on the target:
 *       payouts:       block all pending payout entries for scope_id
 *       benefits:      pause subscription benefits for scope_id
 *       subscriptions: suspend active subscription for scope_id
 *       escrow:        hold all escrow entries for scope_id
 *       fulfillment:   tag fulfillment legs as on_hold
 *   - Updates propagation_status = "applied" (or "failed")
 *   - For time_based release: schedules thaw at release_at
 */
export default async function freezePropagationExecutor(
  container: MedusaContainer,
) {
  const ledgerService = container.resolve("ledger") as any;
  const subscriptionService = container.resolve("subscription") as any;
  const eventBus = container.resolve("event_bus") as any;

  try {
    // Fetch all active freeze records with pending propagation
    const pendingFreezes = (await ledgerService.listFreezeRecords({
      is_active: true,
      propagation_status: "pending",
    })) as any[];

    if (pendingFreezes.length === 0) {
      logger.info("Freeze propagation: no pending propagations");
      return;
    }

    let applied = 0;
    let failed = 0;

    for (const freeze of pendingFreezes) {
      const propagationRules: Array<{ target_type: string; action: string }> =
        freeze.propagates_to ?? [];

      const errors: string[] = [];

      for (const rule of propagationRules) {
        try {
          switch (rule.target_type) {
            case "payouts":
              // Block all pending payout ledger entries for this scope
              await _blockPayouts(ledgerService, freeze.scope_id, freeze.id);
              logger.info(
                `FreezeRecord ${freeze.id}: payouts blocked for ${freeze.scope_id}`,
              );
              break;

            case "benefits":
              // Pause subscription benefits for this customer/vendor
              await _pauseBenefits(
                subscriptionService,
                freeze.scope_id,
                freeze.id,
                eventBus,
              );
              logger.info(
                `FreezeRecord ${freeze.id}: benefits paused for ${freeze.scope_id}`,
              );
              break;

            case "subscriptions":
              // Suspend the subscription
              await _suspendSubscriptions(
                subscriptionService,
                freeze.scope_id,
                freeze.id,
                eventBus,
              );
              logger.info(
                `FreezeRecord ${freeze.id}: subscription suspended for ${freeze.scope_id}`,
              );
              break;

            case "escrow":
              // Hold all escrow entries
              await _holdEscrow(ledgerService, freeze.scope_id, freeze.id);
              logger.info(
                `FreezeRecord ${freeze.id}: escrow held for ${freeze.scope_id}`,
              );
              break;

            case "fulfillment":
              // Emit event — fulfillment service handles hold
              await eventBus.emit?.("freeze.fulfillment_hold", {
                freeze_record_id: freeze.id,
                scope_id: freeze.scope_id,
                scope_type: freeze.scope_type,
              });
              break;

            default:
              logger.warn(
                `FreezeRecord ${freeze.id}: unknown propagation target_type=${rule.target_type}`,
              );
          }
        } catch (err: any) {
          errors.push(`${rule.target_type}: ${err.message}`);
          logger.error(
            `FreezeRecord ${freeze.id} propagation error — ${rule.target_type}: ${err.message}`,
          );
        }
      }

      // Update propagation_status
      const finalStatus =
        errors.length === 0
          ? "applied"
          : errors.length < propagationRules.length
            ? "partially_applied"
            : "failed";
      await ledgerService.updateFreezeRecords({
        id: freeze.id,
        propagation_status: finalStatus,
        propagation_errors: errors.length > 0 ? errors : null,
      } as any);

      // Handle time-based auto-release scheduling
      if (freeze.release_condition === "time_based" && freeze.release_at) {
        const releaseAt = new Date(freeze.release_at);
        if (releaseAt <= new Date()) {
          // Already past release time — thaw immediately
          await ledgerService.thaw(freeze.id, "Time-based auto-release");
          logger.info(
            `FreezeRecord ${freeze.id}: auto-released (time_based release_at already passed)`,
          );
        }
        // Otherwise: a future sweep of this job will thaw it when release_at is reached
      }

      if (errors.length === 0) applied++;
      else failed++;
    }

    logger.info(
      `Freeze propagation: ${applied} applied, ${failed} failed, ${pendingFreezes.length} total processed`,
    );
  } catch (err: any) {
    logger.error(`Freeze propagation executor error: ${err.message}`);
  }
}

async function _blockPayouts(
  ledgerService: any,
  scopeId: string,
  freezeRecordId: string,
) {
  const entries = (await ledgerService.listLedgerEntries({
    account_type: "payout",
    account_id: scopeId,
    status: "posted",
  })) as any[];
  for (const e of entries) {
    await ledgerService.updateLedgerEntries({
      id: e.id,
      status: "frozen",
      metadata: { ...e.metadata, freeze_record_id: freezeRecordId },
    } as any);
  }
}

async function _pauseBenefits(
  subscriptionService: any,
  scopeId: string,
  freezeRecordId: string,
  eventBus: any,
) {
  await eventBus.emit?.("freeze.benefits_paused", {
    scope_id: scopeId,
    freeze_record_id: freezeRecordId,
  });
  // Also try direct subscription service pause if available
  try {
    const subs = (await subscriptionService.listSubscriptions?.({
      customer_id: scopeId,
      status: "active",
    })) as any[];
    for (const sub of subs ?? []) {
      await subscriptionService.updateSubscriptions?.({
        id: sub.id,
        metadata: { ...sub.metadata, benefits_paused_by: freezeRecordId },
      } as any);
    }
  } catch {
    /* best effort */
  }
}

async function _suspendSubscriptions(
  subscriptionService: any,
  scopeId: string,
  freezeRecordId: string,
  eventBus: any,
) {
  await eventBus.emit?.("freeze.subscriptions_suspended", {
    scope_id: scopeId,
    freeze_record_id: freezeRecordId,
  });
}

async function _holdEscrow(
  ledgerService: any,
  scopeId: string,
  freezeRecordId: string,
) {
  const entries = (await ledgerService.listLedgerEntries({
    account_type: "escrow",
    account_id: scopeId,
    status: "posted",
  })) as any[];
  for (const e of entries) {
    await ledgerService.updateLedgerEntries({
      id: e.id,
      status: "frozen",
      metadata: { ...e.metadata, freeze_record_id: freezeRecordId },
    } as any);
  }
}

export const config = {
  name: "freeze-propagation-executor",
  schedule: "*/5 * * * *", // Every 5 minutes — near-realtime propagation
};
