import { MedusaService } from "@medusajs/framework/utils";
import { CommerceContract } from "./models/contract";
import { Obligation } from "./models/obligation";
import { EvidenceRecord } from "./models/evidence-record";
import { createLogger } from "../../lib/logger";

const logger = createLogger("service:commerce-contract");

class CommerceContractModuleService extends MedusaService({
  CommerceContract,
  Obligation,
  EvidenceRecord,
}) {
  /**
   * Create a universal commerce contract.
   */
  async createContract(params: {
    contractType: string;
    parties: Array<{ actor_type: string; actor_id: string; role: string }>;
    offers?: string[];
    resources?: string[];
    obligations?: Array<{
      party_id: string;
      action: string;
      description: string;
      due_at?: string;
      status: string;
    }>;
    settlementRules?: Record<string, unknown>;
    identityRequirements?: string[];
    disputePolicy?: Record<string, unknown>;
    expiresAt?: Date;
    tenantId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<any> {
    const contract = await this.createCommerceContracts({
      contract_type: params.contractType,
      parties: params.parties,
      offers: params.offers ?? null,
      resources: params.resources ?? null,
      obligations: params.obligations ?? null,
      settlement_rules: params.settlementRules ?? null,
      identity_requirements: params.identityRequirements ?? null,
      dispute_policy: params.disputePolicy ?? null,
      lifecycle_state: "CREATED",
      expires_at: params.expiresAt ?? null,
      tenant_id: params.tenantId ?? null,
      metadata: params.metadata ?? null,
    } as any);

    logger.info(
      `Contract created: ${contract.id} [${params.contractType}] with ${params.parties.length} parties`,
    );
    return contract;
  }

  /**
   * Advance contract lifecycle state.
   */
  async advanceState(
    contractId: string,
    newState: string,
    reason?: string,
  ): Promise<any> {
    return this.updateCommerceContracts({
      id: contractId,
      lifecycle_state: newState,
      metadata: reason ? { last_transition_reason: reason } : undefined,
    } as any);
  }

  /**
   * Fulfill an obligation and check if all obligations are met.
   * Returns { all_fulfilled: boolean }
   */
  async fulfillObligation(
    contractId: string,
    partyId: string,
    action: string,
  ): Promise<{ all_fulfilled: boolean; contract: any }> {
    const contract = (await this.retrieveCommerceContract(contractId)) as any;
    const obligations: any[] = contract.obligations ?? [];

    const updated = obligations.map((o: any) =>
      o.party_id === partyId && o.action === action
        ? { ...o, status: "fulfilled" }
        : o,
    );

    const allFulfilled = updated.every((o: any) => o.status === "fulfilled");

    const updatedContract = await this.updateCommerceContracts({
      id: contractId,
      obligations: updated,
      ...(allFulfilled ? { lifecycle_state: "EXECUTED" } : {}),
    } as any);

    if (allFulfilled) {
      logger.info(
        `Contract ${contractId}: all obligations fulfilled → EXECUTED`,
      );
    }
    return { all_fulfilled: allFulfilled, contract: updatedContract };
  }

  /**
   * Add a typed Obligation record to a contract.
   * Persists the obligation as a proper relational row (not just JSON).
   */
  async addObligation(params: {
    contractId: string;
    partyRole: string;
    partyId?: string;
    action: string;
    actionDescription?: string;
    dueAt?: Date;
    gracePeriodHours?: number;
    requiredEvidenceTypes?: string[];
    breachPenaltyAmount?: number;
    breachAction?:
      | "auto_reverse"
      | "freeze_escrow"
      | "notify_only"
      | "escalate";
    slaHours?: number;
    tenantId?: string;
  }): Promise<any> {
    const obligation = await this.createObligations({
      contract_id: params.contractId,
      party_role: params.partyRole,
      party_id: params.partyId ?? null,
      action: params.action,
      action_description: params.actionDescription ?? null,
      due_at: params.dueAt ?? null,
      grace_period_hours: params.gracePeriodHours ?? 0,
      status: "pending",
      required_evidence_types: params.requiredEvidenceTypes ?? null,
      breach_penalty_amount: params.breachPenaltyAmount ?? null,
      breach_penalty_currency: "SAR",
      breach_action: params.breachAction ?? null,
      sla_hours: params.slaHours ?? null,
      overdue: false,
      breach_processed: false,
      fulfilled_at: null,
      breached_at: null,
      evidence_id: null,
      tenant_id: params.tenantId ?? null,
      metadata: null,
    } as any);
    logger.info(
      `Obligation created: ${obligation.id} for contract ${params.contractId} [${params.action}]`,
    );
    return obligation;
  }

  /**
   * Submit evidence for an obligation — marks it fulfilled if evidence is accepted.
   */
  async submitEvidence(params: {
    entityType: string;
    entityId: string;
    evidenceType:
      | "photo"
      | "signature"
      | "gps_proof"
      | "checklist"
      | "device_attestation"
      | "document"
      | "biometric"
      | "blockchain_proof";
    storageUrl?: string;
    storageHash?: string;
    payload?: Record<string, unknown>;
    capturedByType?: string;
    capturedById?: string;
    tenantId?: string;
  }): Promise<any> {
    const evidence = await this.createEvidenceRecords({
      entity_type: params.entityType,
      entity_id: params.entityId,
      evidence_type: params.evidenceType,
      storage_url: params.storageUrl ?? null,
      storage_hash: params.storageHash ?? null,
      payload: params.payload ?? null,
      captured_at: new Date(),
      captured_by_type: params.capturedByType ?? "system",
      captured_by_id: params.capturedById ?? null,
      validation_status: "pending",
      validation_notes: null,
      validated_at: null,
      validated_by: null,
      tenant_id: params.tenantId ?? null,
      metadata: null,
    } as any);
    logger.info(
      `Evidence submitted: ${evidence.id} [${params.evidenceType}] for ${params.entityType}:${params.entityId}`,
    );
    return evidence;
  }
}

export default CommerceContractModuleService;
