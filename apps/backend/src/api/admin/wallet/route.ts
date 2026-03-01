/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const walletOperationSchema = z
  .object({
    wallet_id: z.string(),
    amount: z.number(),
    type: z.enum(["credit", "debit"]),
    reference: z.string(),
    reason: z.string().optional(),
  })
  .strict();

interface CityOSContext {
  tenantId?: string;
  storeId?: string;
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const walletModule = req.scope.resolve("wallet") as unknown as any;
    const cityosContext = req.cityosContext as CityOSContext | undefined;

    const filters: Record<string, unknown> = {};
    if (cityosContext?.tenantId && cityosContext.tenantId !== "default") {
      filters.tenant_id = cityosContext.tenantId;
    }

    const { customer_id, status } = req.query as Record<
      string,
      string | undefined
    >;
    if (customer_id) filters.customer_id = customer_id;
    if (status) filters.status = status;

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const wallets = await walletModule.listWallets(filters, {
      skip: offset,
      take: limit,
    });

    res.json({
      wallets,
      count: Array.isArray(wallets) ? wallets.length : 0,
      limit,
      offset,
    });
  } catch (error) {
    handleApiError(res, error, "GET admin wallets");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const parsed = walletOperationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }

    const walletModule = req.scope.resolve("wallet") as unknown as any;

    let result: any;
    if (parsed.data.type === "credit") {
      result = await walletModule.creditWallet(
        parsed.data.wallet_id,
        parsed.data.amount,
        parsed.data.reason || parsed.data.reference,
        parsed.data.reference,
      );
    } else {
      result = await walletModule.debitWallet(
        parsed.data.wallet_id,
        parsed.data.amount,
        parsed.data.reason || parsed.data.reference,
        parsed.data.reference,
      );
    }

    res.status(201).json({ transaction: result });
  } catch (error) {
    handleApiError(res, error, "POST admin wallet");
  }
}
