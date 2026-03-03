import type { MedusaContainer } from "@medusajs/framework";
import { createLogger } from "../lib/logger";

const logger = createLogger("job:obligation-breach-processor");

/**
 * ObligationBreachProcessor — Scheduled job that scans overdue obligations
 * and triggers configured breach actions.
 *
 * For each overdue Obligation (due_at + grace_period_hours < now && status = "pending"):
 *   1. Mark obligation as "breached"
 *   2. Execute breach_action:
 *      - auto_reverse:   trigger KernelModuleService.transition(contract, REVERSED)
 *      - freeze_escrow:  trigger LedgerModuleService.freezeScope(contract_id, dispute)
 *      - notify_only:    emit ops.obligation_breach event
 *      - escalate:       trigger ApprovalWorkflow escalation
 *   3. Apply breach_penalty_amount if set (post debit to breaching party)
 */
export default async function obligationBreachProcessor(
  container: MedusaContainer,
) {
  const contractService = container.resolve("commerceContract") as any;
  const ledgerService = container.resolve("ledger") as any;
  const kernelService = container.resolve("kernel") as any;
  const eventBus = container.resolve("event_bus") as any;

  try {
    const now = new Date();

    // List all pending obligations
    const obligations = (await contractService.listObligations({
      status: "pending",
    })) as any[];

    let processed = 0;
    let skipped = 0;

    for (const obligation of obligations) {
      if (!obligation.due_at) {
        skipped++;
        continue;
      }

      const dueAt = new Date(obligation.due_at);
      const graceMs = (obligation.grace_period_hours ?? 0) * 3_600_000;
      const effectiveDue = new Date(dueAt.getTime() + graceMs);

      if (now <= effectiveDue) {
        skipped++;
        continue;
      }
      if (obligation.breach_processed) {
        skipped++;
        continue;
      }

      logger.warn(
        `Obligation breached: ${obligation.id} [${obligation.action}] for contract ${obligation.contract_id}`,
      );

      // 1. Mark obligation breached
      await contractService.updateObligations({
        id: obligation.id,
        status: "breached",
        breached_at: now,
        breach_processed: true,
      } as any);

      // 2. Execute breach action
      switch (obligation.breach_action) {
        case "auto_reverse":
          try {
            await kernelService.transition({
              entityType: "contract",
              entityId: obligation.contract_id,
              toState: "REVERSED",
              actorType: "system",
              actorId: "obligation-breach-processor",
              reason: `Obligation breached: ${obligation.action}`,
            });
            logger.info(
              `Contract ${obligation.contract_id} reversed due to obligation breach ${obligation.id}`,
            );
          } catch (e: any) {
            logger.error(
              `auto_reverse failed for ${obligation.contract_id}: ${e.message}`,
            );
          }
          break;

        case "freeze_escrow":
          try {
            await ledgerService.freezeScope({
              scopeType: "contract",
              scopeId: obligation.contract_id,
              reason: "dispute",
              description: `Obligation breached: ${obligation.action} by ${obligation.party_role}`,
              frozenByType: "system",
              propagatesTo: [
                { target_type: "payouts", action: "block" },
                { target_type: "escrow", action: "hold" },
              ],
              releaseCondition: "dispute_resolved",
              conditionReferenceId: obligation.id,
            });
            logger.info(
              `Escrow frozen for contract ${obligation.contract_id} due to obligation breach ${obligation.id}`,
            );
          } catch (e: any) {
            logger.error(
              `freeze_escrow failed for ${obligation.contract_id}: ${e.message}`,
            );
          }
          break;

        case "escalate":
          await eventBus.emit?.("ops.obligation_breach", {
            obligation_id: obligation.id,
            contract_id: obligation.contract_id,
            party_role: obligation.party_role,
            action: obligation.action,
            breach_action: obligation.breach_action,
            escalation_required: true,
          });
          break;

        case "notify_only":
        default:
          await eventBus.emit?.("ops.obligation_breach", {
            obligation_id: obligation.id,
            contract_id: obligation.contract_id,
            party_role: obligation.party_role,
            action: obligation.action,
            breach_action: obligation.breach_action ?? "notify_only",
          });
          break;
      }

      // 3. Apply penalty if defined
      if (
        obligation.breach_penalty_amount &&
        obligation.breach_penalty_amount > 0
      ) {
        try {
          await ledgerService.post([
            {
              accountType: "vendor",
              accountId: obligation.party_id ?? obligation.contract_id,
              debit: obligation.breach_penalty_amount,
              credit: 0,
              valueType: "money",
              currencyCode: obligation.breach_penalty_currency ?? "SAR",
              description: `Breach penalty: obligation ${obligation.id}`,
              referenceType: "obligation",
              referenceId: obligation.id,
            },
            {
              accountType: "commission",
              accountId: "platform",
              debit: 0,
              credit: obligation.breach_penalty_amount,
              valueType: "money",
              currencyCode: obligation.breach_penalty_currency ?? "SAR",
              description: `Breach penalty collected: obligation ${obligation.id}`,
              referenceType: "obligation",
              referenceId: obligation.id,
            },
          ]);
        } catch (e: any) {
          logger.error(
            `Breach penalty posting failed for ${obligation.id}: ${e.message}`,
          );
        }
      }

      processed++;
    }

    logger.info(
      `Obligation breach processor: ${processed} breached, ${skipped} skipped`,
    );
  } catch (err: any) {
    logger.error(`Obligation breach processor error: ${err.message}`);
  }
}

export const config = {
  name: "obligation-breach-processor",
  schedule: "*/30 * * * *", // Every 30 minutes
};
