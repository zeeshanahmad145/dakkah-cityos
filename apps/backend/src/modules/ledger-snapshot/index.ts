import LedgerSnapshotModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const LEDGER_SNAPSHOT_MODULE = "ledgerSnapshot";
export { LedgerSnapshotModuleService };

export default Module(LEDGER_SNAPSHOT_MODULE, {
  service: LedgerSnapshotModuleService,
});
