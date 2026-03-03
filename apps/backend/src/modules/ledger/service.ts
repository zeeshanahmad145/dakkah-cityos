import { MedusaService } from "@medusajs/framework/utils";
import { LedgerEntry } from "./models/ledger-entry";
import { FreezeRecord } from "./models/freeze-record";
import { createLogger } from "../../lib/logger";

const logger = createLogger("service:ledger");

let _journalSeq = 0;
const generateJournalId = () => `jnl_${Date.now()}_${++_journalSeq}`;

class LedgerModuleService extends MedusaService({ LedgerEntry, FreezeRecord }) {
  /**
   * Post an atomic double-entry journal.
   * Always provide matching debit+credit pairs that net to zero.
   *
   * Example — customer pays for a service (5000 SAR):
   *   post([
   *     { accountType:"wallet",     accountId: customerId, debit:  5000, credit: 0,    description: "Service payment" },
   *     { accountType:"escrow",     accountId: orderId,    debit:  0,    credit: 5000, description: "Payment held in escrow" },
   *   ])
   *
   * Example — settlement release (split: vendor 85%, platform 15%):
   *   post([
   *     { accountType:"escrow",      accountId: orderId,   debit: 5000, credit: 0,    description: "Escrow released" },
   *     { accountType:"vendor",      accountId: vendorId,  debit: 0,    credit: 4250, description: "Vendor net payout" },
   *     { accountType:"commission",  accountId: "platform",debit: 0,    credit: 750,  description: "Platform commission" },
   *   ])
   */
  async post(
    entries: Array<{
      accountType: string;
      accountId: string;
      debit: number;
      credit: number;
      valueType?: string;
      currencyCode?: string;
      description?: string;
      referenceType?: string;
      referenceId?: string;
      tenantId?: string;
      metadata?: Record<string, unknown>;
    }>,
  ): Promise<string> {
    const journalId = generateJournalId();
    const now = new Date();

    // Verify books balance
    const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
    const totalCredit = entries.reduce((s, e) => s + e.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new Error(
        `Ledger imbalance: debits=${totalDebit} credits=${totalCredit} for journal ${journalId}`,
      );
    }

    await Promise.all(
      entries.map((e) =>
        this.createLedgerEntries({
          journal_id: journalId,
          account_type: e.accountType,
          account_id: e.accountId,
          debit_amount: e.debit,
          credit_amount: e.credit,
          value_type: e.valueType ?? "money",
          currency_code: e.currencyCode ?? "SAR",
          description: e.description ?? null,
          reference_type: e.referenceType ?? null,
          reference_id: e.referenceId ?? null,
          status: "posted",
          posted_at: now,
          tenant_id: e.tenantId ?? null,
          metadata: e.metadata ?? null,
        } as any),
      ),
    );

    logger.info(
      `Journal ${journalId}: ${entries.length} entries, debit/credit=${totalDebit.toFixed(2)}`,
    );
    return journalId;
  }

  /**
   * Get running balance for an account (credit - debit for credit-normal accounts).
   */
  async getBalance(
    accountType: string,
    accountId: string,
    valueType = "money",
    currencyCode = "SAR",
  ): Promise<number> {
    const entries = (await this.listLedgerEntries({
      account_type: accountType,
      account_id: accountId,
      value_type: valueType,
      currency_code: currencyCode,
      status: "posted",
    })) as any[];

    return entries.reduce(
      (bal, e) => bal + (e.credit_amount ?? 0) - (e.debit_amount ?? 0),
      0,
    );
  }

  /**
   * Create a formal FreezeRecord with scope + propagation semantics.
   * Also freezes all posted ledger entries for the scoped account.
   */
  async freezeScope(params: {
    scopeType:
      | "contract"
      | "vendor"
      | "customer"
      | "account"
      | "settlement_line";
    scopeId: string;
    reason:
      | "dispute"
      | "chargeback"
      | "compliance"
      | "fraud"
      | "admin_override"
      | "insufficient_evidence";
    description?: string;
    frozenByType?: string;
    frozenById?: string;
    propagatesTo?: Array<{ target_type: string; action: string }>;
    releaseCondition:
      | "manual"
      | "dispute_resolved"
      | "time_based"
      | "condition_group";
    releaseAt?: Date;
    conditionReferenceId?: string;
    tenantId?: string;
  }): Promise<any> {
    const record = await this.createFreezeRecords({
      scope_type: params.scopeType,
      scope_id: params.scopeId,
      freeze_reason: params.reason,
      freeze_description: params.description ?? null,
      frozen_by_type: params.frozenByType ?? "system",
      frozen_by_id: params.frozenById ?? null,
      propagates_to: params.propagatesTo ?? null,
      auto_freeze_triggered: false,
      drift_amount: null,
      drift_threshold_config_id: null,
      release_condition: params.releaseCondition,
      release_at: params.releaseAt ?? null,
      condition_reference_id: params.conditionReferenceId ?? null,
      condition_group: null,
      is_active: true,
      released_at: null,
      released_by_type: null,
      released_by_id: null,
      release_notes: null,
      propagation_status: "pending",
      propagation_errors: null,
      frozen_at: new Date(),
      tenant_id: params.tenantId ?? null,
      metadata: null,
    } as any);

    // Also freeze posted ledger entries for this account
    const entries = (await this.listLedgerEntries({
      account_id: params.scopeId,
      status: "posted",
    })) as any[];
    for (const e of entries) {
      await this.updateLedgerEntries({
        id: e.id,
        status: "frozen",
        metadata: { ...e.metadata, freeze_record_id: record.id },
      } as any);
    }
    logger.warn(
      `FreezeRecord ${record.id}: ${params.scopeType}:${params.scopeId} frozen — ${params.reason} (${entries.length} entries)`,
    );
    return record;
  }

  /**
   * Check if a scope is actively frozen.
   */
  async isFrozen(scopeType: string, scopeId: string): Promise<boolean> {
    const records = (await this.listFreezeRecords({
      scope_type: scopeType,
      scope_id: scopeId,
      is_active: true,
    })) as any[];
    return records.length > 0;
  }

  /**
   * Release a freeze by ID (admin or system release).
   */
  async thaw(
    freezeRecordId: string,
    notes?: string,
    releasedById?: string,
  ): Promise<void> {
    await this.updateFreezeRecords({
      id: freezeRecordId,
      is_active: false,
      released_at: new Date(),
      released_by_type: releasedById ? "admin" : "system",
      released_by_id: releasedById ?? null,
      release_notes: notes ?? null,
    } as any);
    logger.info(`FreezeRecord ${freezeRecordId} released`);
  }

  /**
   * Freeze all entries tied to an account (legacy entry-level method, use freezeScope for new flows).
   */
  async freeze(
    accountType: string,
    accountId: string,
    reason: string,
  ): Promise<number> {
    return this.freezeScope({
      scopeType: "account",
      scopeId: accountId,
      reason: "admin_override",
      description: reason,
      releaseCondition: "manual",
      tenantId: undefined,
    }).then(() => 1);
  }

  /**
   * Return full audit trail for all entries linked to a reference.
   */
  async getFullAuditTrail(
    referenceType: string,
    referenceId: string,
  ): Promise<any[]> {
    return this.listLedgerEntries({
      reference_type: referenceType,
      reference_id: referenceId,
    }) as Promise<any[]>;
  }
}

export default LedgerModuleService;
