import { MedusaService } from "@medusajs/framework/utils";
import LoyaltyProgram from "./models/loyalty-program";
import LoyaltyAccount from "./models/loyalty-account";
import PointTransaction from "./models/point-transaction";

// Type aliases for inferred model shapes
type LoyaltyAccountRecord = {
  id: string;
  program_id: string;
  customer_id: string;
  tenant_id: string;
  points_balance: number | string;
  lifetime_points: number | string;
  tier: string | null;
  tier_expires_at: Date | null;
  status: string;
  metadata: Record<string, unknown> | null;
};

type PointTransactionRecord = {
  id: string;
  account_id: string;
  tenant_id: string;
  type: string;
  points: number | string;
  balance_after: number | string;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  expires_at: Date | null;
  metadata: Record<string, unknown> | null;
};

type LoyaltyProgramRecord = {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  points_per_currency: number;
  currency_code: string;
  status: string;
  tiers: unknown | null;
  earn_rules: unknown | null;
  metadata: Record<string, unknown> | null;
};

// MedusaService base generates these CRUD methods — declare them for type safety
interface LoyaltyModuleServiceBase {
  retrieveLoyaltyAccount(id: string): Promise<LoyaltyAccountRecord>;
  retrieveLoyaltyProgram(id: string): Promise<LoyaltyProgramRecord>;
  listLoyaltyAccounts(
    filters?: Record<string, unknown>,
    opts?: Record<string, unknown>,
  ): Promise<LoyaltyAccountRecord[]>;
  listPointTransactions(
    filters?: Record<string, unknown>,
    opts?: Record<string, unknown>,
  ): Promise<PointTransactionRecord[]>;
  updateLoyaltyAccounts(
    data: Record<string, unknown>,
  ): Promise<LoyaltyAccountRecord>;
  createLoyaltyAccounts(
    data: Record<string, unknown>,
  ): Promise<LoyaltyAccountRecord>;
  createPointTransactions(
    data: Record<string, unknown>,
  ): Promise<PointTransactionRecord>;
}

const Base = MedusaService({
  LoyaltyProgram,
  LoyaltyAccount,
  PointTransaction,
});

class LoyaltyModuleService extends Base implements LoyaltyModuleServiceBase {
  async earnPoints(data: {
    accountId: string;
    points: number;
    referenceType?: string;
    referenceId?: string;
    description?: string;
    expiresAt?: Date;
    metadata?: Record<string, unknown>;
  }) {
    const account = await this.retrieveLoyaltyAccount(data.accountId) as any;

    if (account.status !== "active") {
      throw new Error("Loyalty account is not active");
    }

    const newBalance = Number(account.points_balance) + data.points;
    const newLifetime = Number(account.lifetime_points) + data.points;

    await this.updateLoyaltyAccounts({
      id: data.accountId,
      points_balance: newBalance,
      lifetime_points: newLifetime,
    } as any);

    const transaction = await this.createPointTransactions({
      account_id: data.accountId,
      tenant_id: account.tenant_id,
      type: "earn",
      points: data.points,
      balance_after: newBalance,
      reference_type: data.referenceType ?? null,
      reference_id: data.referenceId ?? null,
      description: data.description ?? null,
      expires_at: data.expiresAt ?? null,
      metadata: data.metadata ?? null,
    } as any);

    await this.calculateTier(data.accountId);

    return transaction;
  }

  async redeemPoints(data: {
    accountId: string;
    points: number;
    referenceType?: string;
    referenceId?: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }) {
    const account = await this.retrieveLoyaltyAccount(data.accountId) as any;

    if (account.status !== "active") {
      throw new Error("Loyalty account is not active");
    }

    if (Number(account.points_balance) < data.points) {
      throw new Error("Insufficient points balance");
    }

    const newBalance = Number(account.points_balance) - data.points;

    await this.updateLoyaltyAccounts({
      id: data.accountId,
      points_balance: newBalance,
    } as any);

    const transaction = await this.createPointTransactions({
      account_id: data.accountId,
      tenant_id: account.tenant_id,
      type: "redeem",
      points: -data.points,
      balance_after: newBalance,
      reference_type: data.referenceType ?? null,
      reference_id: data.referenceId ?? null,
      description: data.description ?? null,
      metadata: data.metadata ?? null,
    } as any);

    return transaction;
  }

  async getBalance(accountId: string): Promise<{
    points_balance: number;
    lifetime_points: number;
    tier: string | null;
    tier_expires_at: Date | null;
    status: string;
  }> {
    const account = await this.retrieveLoyaltyAccount(accountId) as any;
    return {
      points_balance: Number(account.points_balance),
      lifetime_points: Number(account.lifetime_points),
      tier: account.tier,
      tier_expires_at: account.tier_expires_at,
      status: account.status,
    };
  }

  async getTransactionHistory(
    accountId: string,
    options?: { limit?: number; offset?: number; type?: string },
  ): Promise<PointTransactionRecord[]> {
    const filters: Record<string, unknown> = { account_id: accountId };
    if (options?.type) {
      filters.type = options.type;
    }
    return this.listPointTransactions(filters, {
      take: options?.limit ?? 20,
      skip: options?.offset ?? 0,
      order: { created_at: "DESC" },
    });
  }

  async calculateTier(accountId: string): Promise<string | null> {
    const account = await this.retrieveLoyaltyAccount(accountId) as any;
    const program = await this.retrieveLoyaltyProgram(account.program_id) as any;

    if (!program.tiers || !Array.isArray(program.tiers)) {
      return account.tier;
    }

    const tiers = program.tiers as Array<{
      name: string;
      min_points: number;
      duration_days?: number;
    }>;

    const sortedTiers = [...tiers].sort((a, b) => b.min_points - a.min_points);
    const lifetimePoints = Number(account.lifetime_points);

    let newTier: string | null = null;
    let tierExpiry: Date | null = null;

    for (const tier of sortedTiers) {
      if (lifetimePoints >= tier.min_points) {
        newTier = tier.name;
        if (tier.duration_days) {
          tierExpiry = new Date();
          tierExpiry.setDate(tierExpiry.getDate() + tier.duration_days);
        }
        break;
      }
    }

    if (newTier !== account.tier) {
      await this.updateLoyaltyAccounts({
        id: accountId,
        tier: newTier,
        tier_expires_at: tierExpiry,
      } as any);
    }

    return newTier;
  }

  async expirePoints(beforeDate: Date): Promise<PointTransactionRecord[]> {
    const transactions = await this.listPointTransactions({ type: "earn" }) as any;
    const expired: PointTransactionRecord[] = [];

    for (const tx of transactions) {
      if (tx.expires_at && new Date(tx.expires_at) <= beforeDate) {
        const account = await this.retrieveLoyaltyAccount(tx.account_id) as any;
        const pointsToExpire = Math.min(
          Number(tx.points),
          Number(account.points_balance),
        );

        if (pointsToExpire > 0) {
          const newBalance = Number(account.points_balance) - pointsToExpire;

          await this.updateLoyaltyAccounts({
            id: tx.account_id,
            points_balance: newBalance,
          } as any);

          const expireTx = await this.createPointTransactions({
            account_id: tx.account_id,
            tenant_id: account.tenant_id,
            type: "expire",
            points: -pointsToExpire,
            balance_after: newBalance,
            reference_type: null,
            reference_id: tx.id,
            description: `Points expired from transaction ${tx.id}`,
          });

          expired.push(expireTx);
        }
      }
    }

    return expired;
  }

  async calculatePoints(programId: string, amount: number): Promise<number> {
    if (amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }
    const program = await this.retrieveLoyaltyProgram(programId) as any;
    const pointsPerUnit = Number(
      (program as Record<string, unknown>).points_per_currency_unit ?? 1,
    );
    const multiplier = Number(
      (program as Record<string, unknown>).multiplier ?? 1,
    );
    return Math.floor(amount * pointsPerUnit * multiplier);
  }

  async getOrCreateAccount(
    programId: string,
    customerId: string,
    tenantId: string,
  ): Promise<LoyaltyAccountRecord> {
    const existing = await this.listLoyaltyAccounts({
      program_id: programId,
      customer_id: customerId,
    }) as any;
    if (existing.length > 0) {
      return existing[0];
    }
    return this.createLoyaltyAccounts({
      program_id: programId,
      customer_id: customerId,
      tenant_id: tenantId,
      points_balance: 0,
      lifetime_points: 0,
      status: "active",
    } as any);
  }
}

export default LoyaltyModuleService;
