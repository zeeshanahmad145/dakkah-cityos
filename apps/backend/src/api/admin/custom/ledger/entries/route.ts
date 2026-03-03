import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { LEDGER_MODULE } from "../../../../../modules/ledger";
import type LedgerModuleService from "../../../../../modules/ledger/service";

/**
 * GET /admin/custom/ledger/entries
 *
 * Read-only ledger entry explorer. Returns the last N double-entry postings.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(
    LEDGER_MODULE,
  ) as unknown as LedgerModuleService;
  const limit = parseInt((req.query.limit as string) ?? "100");
  const filter: Record<string, unknown> = {};
  if (req.query.account_id) filter.from_account_id = req.query.account_id;
  if (req.query.entry_type) filter.entry_type = req.query.entry_type;

  const entries = await svc.listLedgerEntries(filter, {
    take: limit,
    order: { posted_at: "DESC" } as any,
  });
  res.json({ entries, count: Array.isArray(entries) ? entries.length : 0 });
}
