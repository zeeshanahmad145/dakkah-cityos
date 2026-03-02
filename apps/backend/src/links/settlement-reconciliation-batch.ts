import { defineLink } from "@medusajs/framework/utils";
import SettlementModule from "../modules/settlement";
import ReconciliationModule from "../modules/reconciliation";

export default defineLink(
  SettlementModule.linkable.settlementLedger,
  ReconciliationModule.linkable.reconciliationBatch,
);
