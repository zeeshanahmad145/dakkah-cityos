import { MedusaService } from "@medusajs/framework/utils";
import Wallet from "./models/wallet";
import WalletTransaction from "./models/wallet-transaction";
import WalletHold from "./models/wallet-hold";

class WalletModuleService extends MedusaService({
  Wallet,
  WalletTransaction,
  WalletHold,
}) {
  async createWallet(
    customerId: string,
    currency: string = "usd",
  ): Promise<any> {
    const existing = (await this.listWallets({
      customer_id: customerId,
      currency,
    })) as any;
    const list = Array.isArray(existing)
      ? existing
      : [existing].filter(Boolean);

    if (list.length > 0) {
      throw new Error("Wallet already exists for this customer and currency");
    }

    const wallet = await this.createWallets({
      customer_id: customerId,
      currency,
      balance: 0,
      status: "active",
      created_at: new Date(),
    } as any);

    return wallet;
  }

  async creditWallet(
    walletId: string,
    amount: number,
    description?: string,
    referenceId?: string,
  ): Promise<any> {
    if (amount <= 0) {
      throw new Error("Credit amount must be greater than zero");
    }

    const wallet = (await this.retrieveWallet(walletId)) as any;

    if (wallet.status !== "active") {
      throw new Error("Wallet is not active");
    }

    const newBalance = Number(wallet.balance) + amount;

    await this.updateWallets({
      id: walletId,
      balance: newBalance,
    } as any);

    const transaction = await this.createWalletTransactions({
      wallet_id: walletId,
      type: "credit",
      amount,
      balance_after: newBalance,
      description: description || null,
      reference_id: referenceId || null,
      created_at: new Date(),
    } as any);

    return transaction;
  }

  async debitWallet(
    walletId: string,
    amount: number,
    description?: string,
    referenceId?: string,
  ): Promise<any> {
    if (amount <= 0) {
      throw new Error("Debit amount must be greater than zero");
    }

    const wallet = (await this.retrieveWallet(walletId)) as any;

    if (wallet.status !== "active") {
      throw new Error("Wallet is not active");
    }

    if (Number(wallet.balance) < amount) {
      throw new Error("Insufficient wallet balance");
    }

    const newBalance = Number(wallet.balance) - amount;

    await this.updateWallets({
      id: walletId,
      balance: newBalance,
    } as any);

    const transaction = await this.createWalletTransactions({
      wallet_id: walletId,
      type: "debit",
      amount: -amount,
      balance_after: newBalance,
      description: description || null,
      reference_id: referenceId || null,
      created_at: new Date(),
    } as any);

    return transaction;
  }

  async getBalance(
    walletId: string,
  ): Promise<{ balance: number; currency: string; status: string }> {
    const wallet = (await this.retrieveWallet(walletId)) as any;
    return {
      balance: Number(wallet.balance),
      currency: wallet.currency,
      status: wallet.status,
    };
  }

  async freezeWallet(walletId: string, reason?: string): Promise<any> {
    const wallet = (await this.retrieveWallet(walletId)) as any;

    if (wallet.status === "frozen") {
      throw new Error("Wallet is already frozen");
    }

    return await this.updateWallets({
      id: walletId,
      status: "frozen",
      freeze_reason: reason || null,
      frozen_at: new Date(),
    } as any);
  }

  async transferBetweenWallets(
    fromId: string,
    toId: string,
    amount: number,
    reference?: string,
  ): Promise<{
    debitTransaction: any;
    creditTransaction: any;
    amount: number;
  }> {
    if (amount <= 0) {
      throw new Error("Transfer amount must be greater than zero");
    }

    const sourceWallet = (await this.retrieveWallet(fromId)) as any;
    const destWallet = (await this.retrieveWallet(toId)) as any;

    if (sourceWallet.status !== "active") {
      throw new Error("Source wallet is not active");
    }
    if (destWallet.status !== "active") {
      throw new Error("Destination wallet is not active");
    }
    if (Number(sourceWallet.balance) < amount) {
      throw new Error("Insufficient balance in source wallet");
    }

    const debitTransaction = await this.debitWallet(
      fromId,
      amount,
      `Transfer to wallet ${toId}`,
      reference,
    );
    const creditTransaction = await this.creditWallet(
      toId,
      amount,
      `Transfer from wallet ${fromId}`,
      reference,
    );

    return { debitTransaction, creditTransaction, amount };
  }

  async getStatement(
    walletId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    walletId: string;
    startDate: Date;
    endDate: Date;
    openingBalance: number;
    closingBalance: number;
    transactions: any[];
  }> {
    const wallet = (await this.retrieveWallet(walletId)) as any;
    const transactions = (await this.listWalletTransactions(
      { wallet_id: walletId },
      { order: { created_at: "ASC" } },
    )) as any;
    const txList = Array.isArray(transactions)
      ? transactions
      : [transactions].filter(Boolean);

    const filteredTx = txList.filter((tx: any) => {
      const txDate = new Date(tx.created_at);
      return txDate >= new Date(startDate) && txDate <= new Date(endDate);
    });

    const priorTx = txList.filter(
      (tx: any) => new Date(tx.created_at) < new Date(startDate),
    );
    const openingBalance =
      priorTx.length > 0
        ? Number(priorTx[priorTx.length - 1].balance_after || 0)
        : 0;

    let runningBalance = openingBalance;
    const transactionsWithBalance = filteredTx.map((tx: any) => {
      runningBalance = Number(tx.balance_after || runningBalance);
      return { ...tx, running_balance: runningBalance };
    });

    return {
      walletId,
      startDate,
      endDate,
      openingBalance,
      closingBalance: runningBalance,
      transactions: transactionsWithBalance,
    };
  }

  async getTransactionHistory(
    walletId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<any[]> {
    const transactions = (await this.listWalletTransactions(
      { wallet_id: walletId },
      {
        take: options?.limit || 20,
        skip: options?.offset || 0,
        order: { created_at: "DESC" },
      },
    )) as any;
    return Array.isArray(transactions)
      ? transactions
      : [transactions].filter(Boolean);
  }

  // ============ Escrow / Hold Methods ============

  /**
   * Hold funds from a wallet balance.
   * Deducts `amount` from spendable balance but does not release to payee.
   * Creates a WalletHold record and a WalletTransaction of type "hold".
   */
  async holdFunds({
    walletId,
    amount,
    referenceType,
    referenceId,
    description,
    autoReleaseAt,
    tenantId,
  }: {
    walletId: string;
    amount: number;
    referenceType: string;
    referenceId: string;
    description?: string;
    autoReleaseAt?: Date;
    tenantId?: string;
  }): Promise<any> {
    if (amount <= 0) throw new Error("Hold amount must be positive");

    const wallet = (await this.retrieveWallet(walletId)) as any;
    if (wallet.status !== "active") throw new Error("Wallet is not active");
    if (Number(wallet.balance) < amount)
      throw new Error("Insufficient balance to place hold");

    const newBalance = Number(wallet.balance) - amount;
    await this.updateWallets({ id: walletId, balance: newBalance } as any);

    const hold = await this.createWalletHolds({
      wallet_id: walletId,
      tenant_id: tenantId || null,
      hold_amount: amount,
      released_amount: 0,
      currency: wallet.currency,
      status: "pending",
      reference_type: referenceType,
      reference_id: referenceId,
      description: description || null,
      auto_release_at: autoReleaseAt || null,
    } as any);

    await this.createWalletTransactions({
      wallet_id: walletId,
      type: "hold",
      amount: -amount,
      balance_after: newBalance,
      description: description || `Hold for ${referenceType}:${referenceId}`,
      reference_id: referenceId,
      created_at: new Date(),
    } as any);

    return hold;
  }

  /**
   * Release a hold.
   * direction "release" → credited to vendor/payee via payout module
   * direction "return"  → credited back to customer wallet
   */
  async releaseHold({
    holdId,
    direction,
    releasedBy,
    targetWalletId,
  }: {
    holdId: string;
    direction: "release" | "return";
    releasedBy?: string;
    targetWalletId?: string;
  }): Promise<any> {
    const hold = (await this.retrieveWalletHold(holdId)) as any;
    if (hold.status !== "pending" && hold.status !== "disputed") {
      throw new Error(`Hold ${holdId} is already ${hold.status}`);
    }

    const remaining = Number(hold.hold_amount) - Number(hold.released_amount);
    if (remaining <= 0)
      throw new Error("Hold has no remaining amount to release");

    // If returning to customer, credit back their wallet
    if (direction === "return") {
      const wallet = (await this.retrieveWallet(hold.wallet_id)) as any;
      const newBalance = Number(wallet.balance) + remaining;
      await this.updateWallets({
        id: hold.wallet_id,
        balance: newBalance,
      } as any);
      await this.createWalletTransactions({
        wallet_id: hold.wallet_id,
        type: "credit",
        amount: remaining,
        balance_after: newBalance,
        description: `Hold returned: ${hold.reference_type}:${hold.reference_id}`,
        reference_id: hold.id,
        created_at: new Date(),
      } as any);
    }

    // If releasing to a target wallet (e.g. vendor)
    if (direction === "release" && targetWalletId) {
      await this.creditWallet(
        targetWalletId,
        remaining,
        `Escrow release: ${hold.reference_type}:${hold.reference_id}`,
        hold.id,
      );
    }

    return await this.updateWalletHolds({
      id: holdId,
      status: direction === "return" ? "cancelled" : "completed",
      released_amount: Number(hold.hold_amount),
      released_at: new Date(),
      released_by: releasedBy || "system",
    } as any);
  }

  /**
   * Partially release a hold (milestone-based services).
   * Releases `amount` from the hold; sets status to "partial" if more remains.
   */
  async partialRelease({
    holdId,
    amount,
    targetWalletId,
    releasedBy,
  }: {
    holdId: string;
    amount: number;
    targetWalletId?: string;
    releasedBy?: string;
  }): Promise<any> {
    const hold = (await this.retrieveWalletHold(holdId)) as any;
    const remaining = Number(hold.hold_amount) - Number(hold.released_amount);
    if (amount > remaining)
      throw new Error(`Cannot release ${amount} — only ${remaining} remains`);

    if (targetWalletId) {
      await this.creditWallet(
        targetWalletId,
        amount,
        `Milestone release: ${hold.reference_type}:${hold.reference_id}`,
        hold.id,
      );
    }

    const newReleased = Number(hold.released_amount) + amount;
    const isFullyReleased = newReleased >= Number(hold.hold_amount);

    return await this.updateWalletHolds({
      id: holdId,
      released_amount: newReleased,
      status: isFullyReleased ? "completed" : "partial",
      released_at: isFullyReleased ? new Date() : hold.released_at,
      released_by: releasedBy || "system",
    } as any);
  }

  /**
   * Get all active holds for a wallet.
   */
  async getActiveHolds(walletId: string): Promise<any[]> {
    const holds = (await this.listWalletHolds({
      wallet_id: walletId,
      status: ["pending", "disputed", "partial"],
    })) as any;
    return Array.isArray(holds) ? holds : [holds].filter(Boolean);
  }

  /**
   * Get spendable balance = balance (holds already deducted at holdFunds time).
   */
  async getSpendableBalance(
    walletId: string,
  ): Promise<{ spendable: number; on_hold: number; currency: string }> {
    const wallet = (await this.retrieveWallet(walletId)) as any;
    const holds = await this.getActiveHolds(walletId);
    const onHold = holds.reduce(
      (s: number, h: any) =>
        s + (Number(h.hold_amount) - Number(h.released_amount)),
      0,
    );
    return {
      spendable: Number(wallet.balance),
      on_hold: onHold,
      currency: wallet.currency,
    };
  }
}

export default WalletModuleService;
