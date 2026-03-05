import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Wallet",
  "basePath": "/admin/wallet",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "wallet_id": "wlt-1772666195974",
    "type": "credit",
    "amount": 100,
    "reference": "ref-1772666195974"
  },
  "updatePayload": {
    "amount": 200
  }
});
