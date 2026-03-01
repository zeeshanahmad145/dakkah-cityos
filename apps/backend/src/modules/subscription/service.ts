import { MedusaService } from "@medusajs/framework/utils";
import {
  Subscription,
  SubscriptionItem,
  BillingCycle,
  SubscriptionPlan,
  SubscriptionDiscount,
  SubscriptionEvent,
  SubscriptionPause,
} from "./models";

/**
 * Subscription Module Service
 *
 * Manages subscription lifecycle, billing cycles, plans, and recurring payments.
 */
class SubscriptionModuleService extends MedusaService({
  Subscription,
  SubscriptionItem,
  BillingCycle,
  SubscriptionPlan,
  SubscriptionDiscount,
  SubscriptionEvent,
  SubscriptionPause,
}) {
  // ============ Plan Management ============

  /**
   * Get active plans
   */
  async getActivePlans(tenantId?: string): Promise<any[]> {
    const filters: Record<string, unknown> = { status: "active" };
    if (tenantId) filters.tenant_id = tenantId;

    const plans = await this.listSubscriptionPlans(filters) as any;
    const list = Array.isArray(plans) ? plans : [plans].filter(Boolean);
    return list.sort(
      (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0),
    );
  }

  /**
   * Get plan by handle
   */
  async getPlanByHandle(handle: string): Promise<any | null> {
    const plans = await this.listSubscriptionPlans({ handle }) as any;
    const list = Array.isArray(plans) ? plans : [plans].filter(Boolean);
    return list[0] || null;
  }

  // ============ Subscription Lifecycle ============

  /**
   * Create subscription from plan
   */
  async createSubscriptionFromPlan(
    customerId: string,
    planId: string,
    options?: {
      startTrial?: boolean;
      discountCode?: string;
      tenantId?: string;
      storeId?: string;
    },
  ): Promise<any> {
    const plan = await this.retrieveSubscriptionPlan(planId) as any;

    const now = new Date();
    let trialEndDate: Date | null = null;
    let startDate = now;

    // Handle trial
    if (options?.startTrial && plan.trial_period_days > 0) {
      trialEndDate = new Date(now);
      trialEndDate.setDate(trialEndDate.getDate() + plan.trial_period_days);
    }

    // Calculate period end
    const periodEnd = this.calculatePeriodEnd(
      startDate,
      plan.billing_interval,
      plan.billing_interval_count,
    );

    // Create subscription
    const subscription = await this.createSubscriptions({
      customer_id: customerId,
      tenant_id: options?.tenantId,
      store_id: options?.storeId,
      status: trialEndDate ? "draft" : "active",
      start_date: startDate,
      trial_start_date: trialEndDate ? now : null,
      trial_end_date: trialEndDate,
      current_period_start: trialEndDate || startDate,
      current_period_end: trialEndDate || periodEnd,
      billing_interval: plan.billing_interval,
      billing_interval_count: plan.billing_interval_count,
      currency_code: plan.currency_code,
      subtotal: plan.price,
      total: plan.price,
    } as any);

    // Create subscription item for the plan
    await this.createSubscriptionItems({
      subscription_id: subscription.id,
      product_id: plan.id, // Using plan as product reference
      product_title: plan.name,
      quantity: 1,
      unit_price: plan.price,
      subtotal: plan.price,
      total: plan.price,
      tenant_id: options?.tenantId,
    } as any);

    // Apply discount if provided
    if (options?.discountCode) {
      await this.applyDiscountToSubscription(
        subscription.id,
        options.discountCode,
      );
    }

    // Log event
    await this.logSubscriptionEvent(subscription.id, "created", {
      plan_id: planId,
      plan_name: plan.name,
      has_trial: !!trialEndDate,
    });

    if (trialEndDate) {
      await this.logSubscriptionEvent(subscription.id, "trial_started", {
        trial_end_date: trialEndDate,
      });
    }

    return subscription;
  }

  /**
   * Calculate period end date
   */
  calculatePeriodEnd(
    startDate: Date,
    interval: string,
    intervalCount: number,
  ): Date {
    const date = new Date(startDate);

    switch (interval) {
      case "daily":
        date.setDate(date.getDate() + intervalCount);
        break;
      case "weekly":
        date.setDate(date.getDate() + 7 * intervalCount);
        break;
      case "monthly":
        date.setMonth(date.getMonth() + intervalCount);
        break;
      case "quarterly":
        date.setMonth(date.getMonth() + 3 * intervalCount);
        break;
      case "yearly":
        date.setFullYear(date.getFullYear() + intervalCount);
        break;
    }

    return date;
  }

  /**
   * Activate subscription (after trial or immediate)
   */
  async activateSubscription(subscriptionId: string): Promise<any> {
    const subscription = await this.retrieveSubscription(subscriptionId) as any;

    if (subscription.status !== "draft") {
      throw new Error("Only draft subscriptions can be activated");
    }

    const now = new Date();
    const periodEnd = this.calculatePeriodEnd(
      now,
      subscription.billing_interval,
      subscription.billing_interval_count,
    );

    const updated = await this.updateSubscriptions({
      id: subscriptionId,
      status: "active",
      start_date: now,
      current_period_start: now,
      current_period_end: periodEnd,
    } as any);

    await this.logSubscriptionEvent(subscriptionId, "activated");

    // Create first billing cycle
    await this.createBillingCycleForSubscription(subscriptionId);

    return updated;
  }

  // ============ Pause/Resume ============

  /**
   * Pause subscription
   */
  async pauseSubscription(
    subscriptionId: string,
    reason?: string,
    resumeAt?: Date,
  ): Promise<any> {
    const subscription = await this.retrieveSubscription(subscriptionId) as any;

    if (subscription.status !== "active") {
      throw new Error("Only active subscriptions can be paused");
    }

    // Create pause record
    await this.createSubscriptionPauses({
      subscription_id: subscriptionId,
      paused_at: new Date(),
      resume_at: resumeAt,
      reason,
      pause_type: "customer_request",
    } as any);

    const updated = await this.updateSubscriptions({
      id: subscriptionId,
      status: "paused",
    } as any);

    await this.logSubscriptionEvent(subscriptionId, "paused", {
      reason,
      scheduled_resume: resumeAt,
    });

    return updated;
  }

  /**
   * Resume subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<any> {
    const subscription = await this.retrieveSubscription(subscriptionId) as any;

    if (subscription.status !== "paused") {
      throw new Error("Only paused subscriptions can be resumed");
    }

    // Find active pause record
    const pauses = await this.listSubscriptionPauses({
      subscription_id: subscriptionId,
    }) as any;
    const pauseList = Array.isArray(pauses) ? pauses : [pauses].filter(Boolean);
    const activePause = pauseList.find((p: any) => !p.resumed_at);

    if (activePause) {
      const daysPaused = Math.floor(
        (new Date().getTime() - new Date(activePause.paused_at).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      await this.updateSubscriptionPauses({
        id: activePause.id,
        resumed_at: new Date(),
        days_paused: daysPaused,
      } as any);

      // Extend billing period if configured
      if (
        activePause.extends_billing_period &&
        subscription.current_period_end
      ) {
        const currentEnd = new Date(subscription.current_period_end);
        currentEnd.setDate(currentEnd.getDate() + daysPaused);

        await this.updateSubscriptions({
          id: subscriptionId,
          current_period_end: currentEnd,
        } as any);
      }
    }

    const updated = await this.updateSubscriptions({
      id: subscriptionId,
      status: "active",
    } as any);

    await this.logSubscriptionEvent(subscriptionId, "resumed");

    return updated;
  }

  // ============ Cancellation ============

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    options?: {
      cancelImmediately?: boolean;
      reason?: string;
    },
  ): Promise<any> {
    const subscription = await this.retrieveSubscription(subscriptionId) as any;

    if (["canceled", "expired"].includes(subscription.status)) {
      throw new Error("Subscription is already canceled or expired");
    }

    const updates: any = {
      id: subscriptionId,
    };

    if (options?.cancelImmediately) {
      updates.status = "canceled";
      updates.end_date = new Date();
    } else {
      // Cancel at period end
      updates.status = "active"; // Keep active until period end
      updates.end_date = subscription.current_period_end;
    }

    const updated = await this.updateSubscriptions(updates);

    await this.logSubscriptionEvent(subscriptionId, "canceled", {
      immediate: options?.cancelImmediately,
      reason: options?.reason,
      effective_date: updates.end_date,
    });

    return updated;
  }

  // ============ Billing Cycles ============

  /**
   * Create billing cycle for subscription
   */
  async createBillingCycleForSubscription(
    subscriptionId: string,
  ): Promise<any> {
    const subscription = await this.retrieveSubscription(subscriptionId) as any;

    return await this.createBillingCycles({
      subscription_id: subscriptionId,
      tenant_id: subscription.tenant_id,
      period_start: subscription.current_period_start,
      period_end: subscription.current_period_end,
      billing_date: subscription.current_period_end,
      status: "upcoming",
      subtotal: subscription.subtotal,
      tax_total: subscription.tax_total,
      total: subscription.total,
    } as any);
  }

  /**
   * Process billing cycle
   */
  async processBillingCycle(billingCycleId: string): Promise<any> {
    const cycle = await this.retrieveBillingCycle(billingCycleId) as any;

    if (cycle.status !== "upcoming") {
      throw new Error("Billing cycle is not in upcoming status");
    }

    // Mark as processing
    await this.updateBillingCycles({
      id: billingCycleId,
      status: "processing",
    } as any);

    // Here you would integrate with Stripe to collect payment
    // For now, we'll simulate success

    await this.updateBillingCycles({
      id: billingCycleId,
      status: "completed",
    } as any);

    // Log payment success
    await this.logSubscriptionEvent(
      cycle.subscription_id,
      "payment_succeeded",
      {
        billing_cycle_id: billingCycleId,
        amount: cycle.total,
      },
    );

    // Renew subscription period
    await this.renewSubscriptionPeriod(cycle.subscription_id);

    return cycle;
  }

  /**
   * Handle failed billing
   */
  async handleFailedBilling(
    billingCycleId: string,
    failureReason: string,
  ): Promise<any> {
    const cycle = await this.retrieveBillingCycle(billingCycleId) as any;
    const subscription = await this.retrieveSubscription(cycle.subscription_id) as any;

    const attemptCount = (cycle.attempt_count || 0) + 1;
    const maxRetries = subscription.max_retry_attempts || 3;

    // Calculate next retry
    const nextRetryAt = new Date();
    nextRetryAt.setDate(nextRetryAt.getDate() + Math.pow(2, attemptCount)); // Exponential backoff

    await this.updateBillingCycles({
      id: billingCycleId,
      status: attemptCount >= maxRetries ? "failed" : "upcoming",
      attempt_count: attemptCount,
      last_attempt_at: new Date(),
      next_attempt_at: attemptCount < maxRetries ? nextRetryAt : null,
      failure_reason: failureReason,
    } as any);

    await this.logSubscriptionEvent(cycle.subscription_id, "payment_failed", {
      billing_cycle_id: billingCycleId,
      attempt: attemptCount,
      reason: failureReason,
    });

    // Update subscription status if max retries reached
    if (attemptCount >= maxRetries) {
      await this.updateSubscriptions({
        id: cycle.subscription_id,
        status: "past_due",
      } as any);
    }

    return cycle;
  }

  /**
   * Renew subscription period
   */
  async renewSubscriptionPeriod(subscriptionId: string): Promise<any> {
    const subscription = await this.retrieveSubscription(subscriptionId) as any;

    if (!subscription.current_period_end) {
      throw new Error("Subscription has no current period end date");
    }

    const newPeriodStart = new Date(subscription.current_period_end);
    const newPeriodEnd = this.calculatePeriodEnd(
      newPeriodStart,
      subscription.billing_interval,
      subscription.billing_interval_count,
    );

    const updated = await this.updateSubscriptions({
      id: subscriptionId,
      current_period_start: newPeriodStart,
      current_period_end: newPeriodEnd,
      retry_count: 0,
    } as any);

    await this.logSubscriptionEvent(subscriptionId, "renewed", {
      new_period_start: newPeriodStart,
      new_period_end: newPeriodEnd,
    });

    // Create next billing cycle
    await this.createBillingCycleForSubscription(subscriptionId);

    return updated;
  }

  // ============ Upgrades/Downgrades ============

  /**
   * Change subscription plan
   */
  async changePlan(
    subscriptionId: string,
    newPlanId: string,
    options?: {
      prorate?: boolean;
      effectiveDate?: "immediately" | "next_period";
    },
  ): Promise<any> {
    const subscription = await this.retrieveSubscription(subscriptionId) as any;
    const newPlan = await this.retrieveSubscriptionPlan(newPlanId) as any;

    const isUpgrade = Number(newPlan.price) > Number(subscription.total);

    if (options?.effectiveDate === "next_period") {
      // Schedule change for next period
      await this.updateSubscriptions({
        id: subscriptionId,
        metadata: {
          ...subscription.metadata,
          pending_plan_change: {
            plan_id: newPlanId,
            effective_date: subscription.current_period_end,
          },
        },
      });
    } else {
      // Apply immediately
      let prorationAmount = 0;

      if (
        options?.prorate &&
        subscription.current_period_end &&
        subscription.current_period_start
      ) {
        // Calculate proration
        const daysRemaining = Math.ceil(
          (new Date(subscription.current_period_end).getTime() -
            new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        );
        const totalDays = Math.ceil(
          (new Date(subscription.current_period_end).getTime() -
            new Date(subscription.current_period_start).getTime()) /
            (1000 * 60 * 60 * 24),
        );

        const dailyOld = Number(subscription.total) / totalDays;
        const dailyNew = Number(newPlan.price) / totalDays;
        prorationAmount = (dailyNew - dailyOld) * daysRemaining;
      }

      // Update subscription items
      const items = await this.listSubscriptionItems({
        subscription_id: subscriptionId,
      }) as any;
      const itemList = Array.isArray(items) ? items : [items].filter(Boolean);

      // Remove old items
      for (const item of itemList) {
        await this.deleteSubscriptionItems(item.id);
      }

      // Add new plan item
      await this.createSubscriptionItems({
        subscription_id: subscriptionId,
        product_id: newPlanId,
        product_title: newPlan.name,
        quantity: 1,
        unit_price: newPlan.price,
        subtotal: newPlan.price,
        total: newPlan.price,
        tenant_id: subscription.tenant_id,
      } as any);

      await this.updateSubscriptions({
        id: subscriptionId,
        subtotal: newPlan.price,
        total: newPlan.price,
        billing_interval: newPlan.billing_interval,
        billing_interval_count: newPlan.billing_interval_count,
      } as any);

      await this.logSubscriptionEvent(
        subscriptionId,
        isUpgrade ? "upgraded" : "downgraded",
        {
          from_plan: subscription.metadata?.plan_id,
          to_plan: newPlanId,
          proration_amount: prorationAmount,
        },
      );
    }

    return await this.retrieveSubscription(subscriptionId) as any;
  }

  // ============ Discounts ============

  /**
   * Apply discount to subscription
   */
  async applyDiscountToSubscription(
    subscriptionId: string,
    discountCode: string,
  ): Promise<any> {
    const discounts = await this.listSubscriptionDiscounts({
      code: discountCode,
      is_active: true,
    }) as any;
    const discountList = Array.isArray(discounts)
      ? discounts
      : [discounts].filter(Boolean);

    if (discountList.length === 0) {
      throw new Error("Invalid discount code");
    }

    const discount = discountList[0];

    // Validate discount
    if (
      discount.max_redemptions &&
      discount.current_redemptions >= discount.max_redemptions
    ) {
      throw new Error("Discount has reached maximum redemptions");
    }

    const now = new Date();
    if (discount.starts_at && new Date(discount.starts_at) > now) {
      throw new Error("Discount is not yet active");
    }
    if (discount.ends_at && new Date(discount.ends_at) < now) {
      throw new Error("Discount has expired");
    }

    const subscription = await this.retrieveSubscription(subscriptionId) as any;

    // Calculate discount amount
    let discountAmount = 0;
    if (discount.discount_type === "percentage") {
      discountAmount =
        Number(subscription.subtotal) * (Number(discount.discount_value) / 100);
    } else if (discount.discount_type === "fixed") {
      discountAmount = Number(discount.discount_value);
    }

    // Update subscription with discount
    await this.updateSubscriptions({
      id: subscriptionId,
      total: Number(subscription.subtotal) - discountAmount,
      metadata: {
        ...subscription.metadata,
        applied_discount: {
          code: discountCode,
          discount_id: discount.id,
          amount: discountAmount,
          duration: discount.duration,
          duration_in_months: discount.duration_in_months,
        },
      },
    });

    // Increment redemption count
    await this.updateSubscriptionDiscounts({
      id: discount.id,
      current_redemptions: discount.current_redemptions + 1,
    } as any);

    return subscription;
  }

  // ============ Event Logging ============

  /**
   * Log subscription event
   */
  async logSubscriptionEvent(
    subscriptionId: string,
    eventType: string,
    eventData?: any,
    triggeredBy: string = "system",
    triggeredById?: string,
  ): Promise<any> {
    const subscription = await this.retrieveSubscription(subscriptionId) as any;

    return await this.createSubscriptionEvents({
      subscription_id: subscriptionId,
      tenant_id: subscription.tenant_id,
      event_type: eventType,
      event_data: eventData,
      triggered_by: triggeredBy,
      triggered_by_id: triggeredById,
      occurred_at: new Date(),
    } as any);
  }

  // ============ Queries ============

  /**
   * Get customer subscriptions
   */
  async getCustomerSubscriptions(customerId: string): Promise<any[]> {
    const subscriptions = await this.listSubscriptions({
      customer_id: customerId,
    }) as any;
    return Array.isArray(subscriptions)
      ? subscriptions
      : [subscriptions].filter(Boolean);
  }

  /**
   * Get subscriptions due for billing
   */
  async getSubscriptionsDueForBilling(beforeDate: Date): Promise<any[]> {
    const cycles = await this.listBillingCycles({
      status: "upcoming",
    }) as any;

    const cycleList = (
      Array.isArray(cycles) ? cycles : [cycles].filter(Boolean)
    ).filter((c: any) => new Date(c.billing_date) <= beforeDate);

    return cycleList;
  }

  /**
   * Get subscription history
   */
  async getSubscriptionHistory(subscriptionId: string): Promise<any[]> {
    const events = await this.listSubscriptionEvents({
      subscription_id: subscriptionId,
    }) as any;
    const eventList = Array.isArray(events) ? events : [events].filter(Boolean);
    return eventList.sort(
      (a: any, b: any) =>
        new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
    );
  }
}

export default SubscriptionModuleService;
