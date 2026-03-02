import { MedusaService } from "@medusajs/framework/utils";
import { OrderStateConfig } from "./models/order-state-config";
import { OrderSlaTimer } from "./models/order-sla-timer";
import { OrderTransitionLog } from "./models/order-transition-log";

const DEFAULT_STATE_CONFIGS = {
  physical: {
    valid_states: [
      "pending",
      "payment_captured",
      "processing",
      "ready_to_ship",
      "shipped",
      "delivered",
      "completed",
      "cancelled",
      "refunded",
    ],
    transition_rules: {
      pending: ["payment_captured", "cancelled"],
      payment_captured: ["processing", "cancelled"],
      processing: ["ready_to_ship", "cancelled"],
      ready_to_ship: ["shipped", "cancelled"],
      shipped: ["delivered", "cancelled"],
      delivered: ["completed", "refunded"],
      completed: ["refunded"],
      cancelled: [],
      refunded: [],
    },
    sla_hours: { processing: 24, ready_to_ship: 48, shipped: 120 },
  },
  digital: {
    valid_states: [
      "pending",
      "payment_captured",
      "fulfilling",
      "completed",
      "cancelled",
      "refunded",
    ],
    transition_rules: {
      pending: ["payment_captured", "cancelled"],
      payment_captured: ["fulfilling", "cancelled"],
      fulfilling: ["completed", "cancelled"],
      completed: ["refunded"],
      cancelled: [],
      refunded: [],
    },
    sla_hours: { fulfilling: 1 },
  },
  booking: {
    valid_states: [
      "pending",
      "confirmed",
      "in_progress",
      "completed",
      "cancelled",
      "no_show",
    ],
    transition_rules: {
      pending: ["confirmed", "cancelled"],
      confirmed: ["in_progress", "cancelled", "no_show"],
      in_progress: ["completed"],
      completed: [],
      cancelled: [],
      no_show: [],
    },
    sla_hours: { confirmed: 2 },
  },
  subscription: {
    valid_states: ["pending", "active", "past_due", "paused", "cancelled"],
    transition_rules: {
      pending: ["active", "cancelled"],
      active: ["past_due", "paused", "cancelled"],
      past_due: ["active", "cancelled"],
      paused: ["active", "cancelled"],
      cancelled: [],
    },
    sla_hours: { past_due: 72 },
  },
  service: {
    valid_states: [
      "pending",
      "payment_captured",
      "assigned",
      "in_progress",
      "completed",
      "cancelled",
      "refunded",
    ],
    transition_rules: {
      pending: ["payment_captured", "cancelled"],
      payment_captured: ["assigned", "cancelled"],
      assigned: ["in_progress", "cancelled"],
      in_progress: ["completed"],
      completed: ["refunded"],
      cancelled: [],
      refunded: [],
    },
    sla_hours: { assigned: 4 },
  },
  auction: {
    valid_states: [
      "pending",
      "won",
      "payment_captured",
      "processing",
      "shipped",
      "completed",
      "cancelled",
    ],
    transition_rules: {
      pending: ["won", "cancelled"],
      won: ["payment_captured", "cancelled"],
      payment_captured: ["processing"],
      processing: ["shipped"],
      shipped: ["completed"],
      completed: [],
      cancelled: [],
    },
    sla_hours: { won: 24, payment_captured: 48 },
  },
};

class OrderOrchestrationModuleService extends MedusaService({
  OrderStateConfig,
  OrderSlaTimer,
  OrderTransitionLog,
}) {
  /**
   * Validate that a state transition is allowed for the given order type.
   */
  async validateTransition(
    orderId: string,
    orderType: string,
    fromState: string | null,
    toState: string,
  ): Promise<{ valid: boolean; reason?: string }> {
    // Try DB config first, fall back to defaults
    const configs = (await this.listOrderStateConfigs({
      order_type: orderType,
      is_active: true,
    })) as any[];

    const config: any =
      configs.length > 0
        ? configs[0]
        : (DEFAULT_STATE_CONFIGS as any)[orderType];

    if (!config) {
      return { valid: true }; // unknown type — allow
    }

    const rules = config.transition_rules as Record<string, string[]>;
    const validStates: string[] = config.valid_states;

    if (!validStates.includes(toState)) {
      return {
        valid: false,
        reason: `"${toState}" is not a valid state for order type "${orderType}"`,
      };
    }

    if (fromState && rules[fromState] && !rules[fromState].includes(toState)) {
      return {
        valid: false,
        reason: `Cannot transition from "${fromState}" to "${toState}" for order type "${orderType}"`,
      };
    }

    return { valid: true };
  }

  /**
   * Record a state transition and optionally set SLA timer.
   */
  async recordTransition(
    orderId: string,
    orderType: string,
    fromState: string | null,
    toState: string,
    triggeredBy: string,
    idempotencyKey?: string,
    notes?: string,
  ): Promise<{ log: any; timer: any | null }> {
    // Idempotency check
    if (idempotencyKey) {
      const existing = (await this.listOrderTransitionLogs({
        idempotency_key: idempotencyKey,
      })) as any[];
      if (existing.length > 0) {
        return { log: existing[0], timer: null };
      }
    }

    const log = await this.createOrderTransitionLogs({
      order_id: orderId,
      from_state: fromState,
      to_state: toState,
      triggered_by: triggeredBy,
      idempotency_key: idempotencyKey ?? null,
      notes: notes ?? null,
    } as any);

    // Resolve SLA hours
    const configs = (await this.listOrderStateConfigs({
      order_type: orderType,
      is_active: true,
    })) as any[];
    const config: any =
      configs.length > 0
        ? configs[0]
        : (DEFAULT_STATE_CONFIGS as any)[orderType];
    const slaHours = config?.sla_hours?.[toState];

    let timer: any = null;
    if (slaHours) {
      // Close previous timer
      const prevTimers = (await this.listOrderSlaTimers({
        order_id: orderId,
        resolved_at: null,
      })) as any[];
      for (const t of prevTimers) {
        await this.updateOrderSlaTimers({
          id: t.id,
          resolved_at: new Date(),
        } as any);
      }

      const deadline = new Date(Date.now() + slaHours * 3600 * 1000);
      timer = await this.createOrderSlaTimers({
        order_id: orderId,
        current_state: toState,
        sla_deadline: deadline,
        escalation_status: "none",
      } as any);
    }

    return { log, timer };
  }

  /**
   * Find orders with breached SLA timers.
   */
  async getBreachedTimers(): Promise<any[]> {
    const timers = (await this.listOrderSlaTimers({
      resolved_at: null,
      escalation_status: "none",
    })) as any[];
    const now = new Date();
    return timers.filter((t: any) => new Date(t.sla_deadline) < now);
  }
}

export default OrderOrchestrationModuleService;
