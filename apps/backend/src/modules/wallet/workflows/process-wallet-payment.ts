import {
  createWorkflow,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";

/**
 * Process Wallet Payment Workflow
 * Debit wallet → reserve funds → create order line → confirm.
 */
const validateWalletBalanceStep = createStep(
  "validate-wallet-balance",
  async (
    { walletId, amount }: { walletId: string; amount: number },
    { container },
  ) => {
    const walletService = container.resolve("wallet") as unknown as any;
    const wallet = await walletService.retrieveWallet(walletId);
    const balance = Number(wallet.balance || 0);

    if (balance < amount) {
      throw new Error(`Insufficient wallet balance: ${balance} < ${amount}`);
    }

    return new StepResponse({ wallet, sufficient: true }, { walletId, amount });
  },
);

const debitWalletStep = createStep(
  "debit-wallet",
  async (
    {
      walletId,
      amount,
      orderId,
    }: { walletId: string; amount: number; orderId?: string },
    { container },
  ) => {
    const walletService = container.resolve("wallet") as unknown as any;
    const transaction = await walletService.debitWallet(
      walletId,
      amount,
      `Payment for order ${orderId || "unknown"}`,
      orderId,
    );
    return new StepResponse({ transaction }, { walletId, amount });
  },
  // Compensation: refund the wallet if downstream steps fail
  async (
    { walletId, amount }: { walletId: string; amount: number },
    { container },
  ) => {
    const walletService = container.resolve("wallet") as unknown as any;
    await walletService.creditWallet(
      walletId,
      amount,
      "Refund — wallet payment reversal",
    );
  },
);

const markWalletPaymentCompleteStep = createStep(
  "mark-wallet-payment-complete",
  async (
    {
      walletId,
      amount,
      orderId,
    }: { walletId: string; amount: number; orderId?: string },
    { container },
  ) => {
    // Emit a payment event or update order payment status
    const walletService = container.resolve("wallet") as unknown as any;
    const wallet = await walletService.retrieveWallet(walletId);
    return new StepResponse({
      wallet_id: walletId,
      amount_paid: amount,
      order_id: orderId,
      new_balance: wallet.balance,
      status: "completed",
    });
  },
);

export const processWalletPaymentWorkflow = createWorkflow(
  "process-wallet-payment",
  // @ts-ignore: workflow builder type
  (input: { walletId: string; amount: number; orderId?: string }) => {
    const validated = validateWalletBalanceStep({
      walletId: input.walletId,
      amount: input.amount,
    });
    const debited = debitWalletStep({
      walletId: input.walletId,
      amount: input.amount,
      orderId: input.orderId,
    });
    const complete = markWalletPaymentCompleteStep({
      walletId: input.walletId,
      amount: input.amount,
      orderId: input.orderId,
    });
    return { validated, debited, complete };
  },
);
