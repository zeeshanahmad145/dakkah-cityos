import { MedusaService } from "@medusajs/framework/utils";
import { SagaInstance } from "./models/saga-instance";
import { createLogger } from "../../lib/logger";

const logger = createLogger("service:saga");

// Typed step names for checkout saga
type CheckoutStep =
  | "payment_captured"
  | "inventory_reserved"
  | "fulfillment_created"
  | "order_confirmed";
type RefundStep =
  | "payment_refunded"
  | "inventory_returned"
  | "settlement_reversed"
  | "loyalty_reversed";
type SagaType = "checkout" | "refund" | "payout" | "rma" | "vendor_onboarding";

// Compensation handlers map — step name → what to undo
const COMPENSATIONS: Record<string, string> = {
  payment_captured: "refund_payment",
  inventory_reserved: "release_inventory",
  fulfillment_created: "cancel_fulfillment",
  order_confirmed: "cancel_order",
  payment_refunded: "reverse_payment_refund",
  settlement_reversed: "restore_settlement",
};

class SagaModuleService extends MedusaService({ SagaInstance }) {
  /**
   * Start a new saga instance for a distributed transaction.
   */
  async startSaga(params: {
    sagaType: SagaType;
    payload: Record<string, any>;
    orderId?: string;
    customerId?: string;
    tenantId?: string;
  }): Promise<any> {
    const saga = await this.createSagaInstances({
      saga_type: params.sagaType,
      status: "running",
      current_step: 0,
      steps_executed: [],
      compensation_log: [],
      payload: params.payload,
      order_id: params.orderId ?? null,
      customer_id: params.customerId ?? null,
      tenant_id: params.tenantId ?? null,
    } as any);
    logger.info(`Saga started: ${saga.id} (${params.sagaType})`);
    return saga;
  }

  /**
   * Record a completed step and advance the saga.
   */
  async completeStep(
    sagaId: string,
    step: string,
    output: Record<string, any> = {},
  ): Promise<any> {
    const saga = (await this.retrieveSagaInstance(sagaId)) as any;
    if (saga.status !== "running")
      throw new Error(`Saga ${sagaId} not in running state`);

    const stepsExecuted = [
      ...(saga.steps_executed ?? []),
      { step, output, executed_at: new Date().toISOString() },
    ];
    return this.updateSagaInstances({
      id: sagaId,
      current_step: (saga.current_step ?? 0) + 1,
      steps_executed: stepsExecuted,
    } as any);
  }

  /**
   * Trigger rollback: marks saga as compensating and logs what needs to be undone.
   * Actual compensation is handled by listeners on `saga.compensation_requested`.
   */
  async compensate(sagaId: string, reason: string): Promise<any> {
    const saga = (await this.retrieveSagaInstance(sagaId)) as any;
    if (["compensated", "completed"].includes(saga.status)) return saga;

    const stepsToCompensate = [...(saga.steps_executed ?? [])]
      .reverse()
      .map((s: any) => ({
        step: s.step,
        compensation: COMPENSATIONS[s.step] ?? `undo_${s.step}`,
        original_output: s.output,
      }));

    await this.updateSagaInstances({
      id: sagaId,
      status: "compensating",
      failure_reason: reason,
      failed_at: new Date(),
      compensation_log: stepsToCompensate,
    } as any);

    logger.warn(
      `Saga ${sagaId} (${saga.saga_type}) compensating: ${stepsToCompensate.length} steps to undo`,
    );
    return { sagaId, stepsToCompensate };
  }

  /**
   * Mark an individual compensation step as done.
   */
  async markCompensationStep(
    sagaId: string,
    step: string,
    result: Record<string, any> = {},
  ): Promise<void> {
    const saga = (await this.retrieveSagaInstance(sagaId)) as any;
    const log = (saga.compensation_log ?? []).map((s: any) =>
      s.compensation === step
        ? { ...s, result, compensated_at: new Date().toISOString() }
        : s,
    );
    const allDone = log.every((s: any) => s.compensated_at);
    await this.updateSagaInstances({
      id: sagaId,
      compensation_log: log,
      ...(allDone ? { status: "compensated", completed_at: new Date() } : {}),
    } as any);
  }

  /**
   * Mark saga as successfully completed.
   */
  async complete(sagaId: string): Promise<any> {
    return this.updateSagaInstances({
      id: sagaId,
      status: "completed",
      completed_at: new Date(),
    } as any);
  }

  /**
   * Find stuck running sagas older than `thresholdMinutes`.
   */
  async getStuckSagas(thresholdMinutes = 60): Promise<any[]> {
    const cutoff = new Date(Date.now() - thresholdMinutes * 60_000);
    // MedusaService list — filter via service layer
    const all = (await this.listSagaInstances({ status: "running" })) as any[];
    return all.filter((s: any) => new Date(s.created_at) < cutoff);
  }
}

export default SagaModuleService;
