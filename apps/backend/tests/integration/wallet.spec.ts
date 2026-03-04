import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Wallet",
  "basePath": "/admin/wallet",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "wallet_id": "wal-45524914",
    "amount": 1000,
    "type": "credit",
    "reference": "ref-45524914"
  },
  "updatePayload": {
    "amount": 2000,
    "type": "debit",
    "reference": "ref2-45524914"
  }
});
