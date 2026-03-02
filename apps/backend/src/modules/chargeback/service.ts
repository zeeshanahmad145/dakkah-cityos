import { MedusaService } from "@medusajs/framework/utils";
import { Chargeback, ChargebackEvidence } from "./models/chargeback";

class ChargebackModuleService extends MedusaService({
  Chargeback,
  ChargebackEvidence,
}) {
  /**
   * Process an incoming provider chargeback webhook event.
   */
  async processWebhookEvent(params: {
    orderId: string;
    providerReferenceId: string;
    provider: string;
    reasonCode: string;
    amount: number;
    currencyCode: string;
    dueBy?: Date;
    metadata?: Record<string, any>;
  }): Promise<any> {
    // Idempotency: check if already exists
    const existing = (await this.listChargebacks({
      provider_reference_id: params.providerReferenceId,
    })) as any[];
    if (existing.length > 0) return existing[0];

    return this.createChargebacks({
      order_id: params.orderId,
      provider_reference_id: params.providerReferenceId,
      provider: params.provider ?? "stripe",
      reason_code: params.reasonCode,
      amount: params.amount,
      currency_code: params.currencyCode ?? "SAR",
      status: "received",
      due_by: params.dueBy ?? null,
      metadata: params.metadata ?? null,
    } as any);
  }

  /**
   * Update chargeback status from provider webhook (won/lost/withdrawn).
   */
  async updateStatus(
    providerReferenceId: string,
    status: "won" | "lost" | "withdrawn" | "evidence_submitted",
  ): Promise<any> {
    const chargebacks = (await this.listChargebacks({
      provider_reference_id: providerReferenceId,
    })) as any[];
    if (chargebacks.length === 0)
      throw new Error(`Chargeback ${providerReferenceId} not found`);

    const cb = chargebacks[0];
    const update: any = {
      id: cb.id,
      status,
      resolved_at: ["won", "lost", "withdrawn"].includes(status)
        ? new Date()
        : null,
    };

    if (status === "lost") {
      update.negative_balance_amount = cb.amount;
    }

    return this.updateChargebacks(update);
  }

  /**
   * Submit evidence for a chargeback (admin action).
   */
  async submitEvidence(
    chargebackId: string,
    evidence: {
      evidenceType: string;
      description?: string;
      fileUrl?: string;
    }[],
  ): Promise<any[]> {
    const records = await Promise.all(
      evidence.map((e) =>
        this.createChargebackEvidences({
          chargeback_id: chargebackId,
          evidence_type: e.evidenceType,
          description: e.description ?? null,
          file_url: e.fileUrl ?? null,
          submitted_at: new Date(),
        } as any),
      ),
    );
    await this.updateChargebacks({
      id: chargebackId,
      status: "evidence_submitted",
    } as any);
    return records;
  }
}

export default ChargebackModuleService;
