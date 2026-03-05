import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Insurance",
  "basePath": "/admin/insurance",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "customer_id": "c-1772666195974",
    "premium_amount": 500,
    "coverage_amount": 50000,
    "starts_at": "2026-04-01T00:00:00Z",
    "expires_at": "2027-04-01T00:00:00Z"
  },
  "updatePayload": {
    "premium_amount": 450
  }
});
