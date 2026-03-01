import { MedusaService } from "@medusajs/framework/utils";
import Wallet from "./models/wallet";
import WalletTransaction from "./models/wallet-transaction";

class WalletModuleService extends MedusaService({ Wallet, WalletTransaction }) {
  async createWallet(
    customerId: string,
    currency: string = "usd",
  ): Promise<any> {
    const existing = await this.listWallets({
      customer_id: customerId,
      currency,
    }) as any;
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

    const wallet = await this.retrieveWallet(walletId) as any;

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

    const wallet = await this.retrieveWallet(walletId) as any;

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
    const wallet = await this.retrieveWallet(walletId) as any;
    return {
      balance: Number(wallet.balance),
      currency: wallet.currency,
      status: wallet.status,
    };
  }

  async freezeWallet(walletId: string, reason?: string): Promise<any> {
    const wallet = await this.retrieveWallet(walletId) as any;

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

    const sourceWallet = await this.retrieveWallet(fromId) as any;
    const destWallet = await this.retrieveWallet(toId) as any;

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
    const wallet = await this.retrieveWallet(walletId) as any;
    const transactions = await this.listWalletTransactions(
      { wallet_id: walletId },
      { order: { created_at: "ASC" } },
    ) as any;
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
    const transactions = await this.listWalletTransactions(
      { wallet_id: walletId },
      {
        take: options?.limit || 20,
        skip: options?.offset || 0,
        order: { created_at: "DESC" },
      },
    ) as any;
    return Array.isArray(transactions)
      ? transactions
      : [transactions].filter(Boolean);
  }
}

export default WalletModuleService;
