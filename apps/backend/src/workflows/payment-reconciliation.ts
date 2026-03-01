import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";

type PaymentReconciliationInput = {
  tenantId: string;
  dateFrom: string;
  dateTo: string;
  paymentProvider: string;
};

const fetchPaymentRecordsStep = createStep(
  "fetch-payment-records-step",
  async (input: PaymentReconciliationInput, { container }) => {
    const paymentModule = container.resolve("payment") as unknown as any;
    const payments = await paymentModule.listPayments({
      created_at: {
        $gte: new Date(input.dateFrom),
        $lte: new Date(input.dateTo),
      },
    });
    return new StepResponse({ payments, count: payments.length }, null);
  },
);

const fetchOrderRecordsStep = createStep(
  "fetch-order-records-step",
  async (input: { dateFrom: string; dateTo: string }, { container }) => {
    const orderModule = container.resolve("order") as unknown as any;
    const orders = await orderModule.listOrders({
      created_at: {
        $gte: new Date(input.dateFrom),
        $lte: new Date(input.dateTo),
      },
    });
    return new StepResponse({ orders }, null);
  },
);

const matchTransactionsStep = createStep(
  "match-payment-transactions-step",
  async (input: { payments: any[]; orders: any[] }) => {
    const matches: any[] = [];
    const unmatched: any[] = [];
    const matchedOrderIds = new Set<string>();

    for (const payment of input.payments) {
      const match = input.orders.find((o: any) => {
        if (matchedOrderIds.has(o.id)) return false;
        const amountMatch =
          Math.abs((o.total || 0) - (payment.amount || 0)) < 0.01;
        const referenceMatch = o.id === payment.reference_id;
        const dateProximity =
          Math.abs(
            new Date(o.created_at).getTime() -
              new Date(payment.created_at).getTime(),
          ) < 86400000;
        return amountMatch && (referenceMatch || dateProximity);
      });

      if (match) {
        matchedOrderIds.add(match.id);
        matches.push({
          payment_id: payment.id,
          order_id: match.id,
          payment_amount: payment.amount,
          order_total: match.total,
          matched: true,
          confidence: payment.reference_id === match.id ? 1.0 : 0.8,
        });
      } else {
        unmatched.push({
          payment_id: payment.id,
          amount: payment.amount,
          matched: false,
          reason:
            "No matching order found by amount, reference, or date proximity",
        });
      }
    }

    return new StepResponse(
      {
        matched: matches,
        unmatched,
        unmatchedCount: unmatched.length,
        matchedCount: matches.length,
        totalPayments: input.payments.length,
      },
      null,
    );
  },
);

const reconcileStep = createStep(
  "reconcile-payments-step",
  async (input: {
    matched: any[];
    unmatchedCount: number;
    tenantId: string;
  }) => {
    const reconciliation = {
      tenant_id: input.tenantId,
      total_reconciled: input.matched.length,
      total_unmatched: input.unmatchedCount,
      status: input.unmatchedCount === 0 ? "completed" : "partial",
      high_confidence: input.matched.filter((m: any) => m.confidence === 1.0)
        .length,
      low_confidence: input.matched.filter((m: any) => m.confidence < 1.0)
        .length,
      reconciled_at: new Date(),
    };
    return new StepResponse(
      { reconciliation },
      { tenantId: input.tenantId, reconciliation },
    );
  },
  async (
    compensationData: { tenantId: string; reconciliation: any } | null,
    { container },
  ) => {
    if (!compensationData) return;
    try {
      const paymentModule = container.resolve("payment") as unknown as any;
      if (paymentModule.reverseReconciliation) {
        await paymentModule.reverseReconciliation(
          compensationData.tenantId,
          compensationData.reconciliation,
        );
      }
    } catch (error) {}
  },
);

const generateReportStep = createStep(
  "generate-reconciliation-report-step",
  async (input: {
    reconciliation: any;
    unmatched: any[];
    dateFrom: string;
    dateTo: string;
  }) => {
    const report = {
      period: { from: input.dateFrom, to: input.dateTo },
      total_reconciled: input.reconciliation.total_reconciled,
      total_unmatched: input.reconciliation.total_unmatched,
      high_confidence_matches: input.reconciliation.high_confidence,
      low_confidence_matches: input.reconciliation.low_confidence,
      status: input.reconciliation.status,
      unmatched_payments: input.unmatched,
      generated_at: new Date(),
    };
    return new StepResponse({ report }, { report });
  },
  async (compensationData: { report: any } | null, { container }) => {
    if (!compensationData) return;
    try {
      const paymentModule = container.resolve("payment") as unknown as any;
      if (paymentModule.deleteReconciliationReport) {
        await paymentModule.deleteReconciliationReport(compensationData.report);
      }
    } catch (error) {}
  },
);

export const paymentReconciliationWorkflow = createWorkflow(
  "payment-reconciliation-workflow",
  (input: PaymentReconciliationInput) => {
    const { payments } = fetchPaymentRecordsStep(input);
    const { orders } = fetchOrderRecordsStep({
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
    });
    const { matched, unmatched, unmatchedCount } = matchTransactionsStep({
      payments,
      orders,
    });
    const { reconciliation } = reconcileStep({
      matched,
      unmatchedCount,
      tenantId: input.tenantId,
    });
    const { report } = generateReportStep({
      reconciliation,
      unmatched,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
    });
    return new WorkflowResponse({ reconciliation, report });
  },
);
