import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Insurance",
  "basePath": "/admin/insurance",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "customer_id": "test-customer-1",
    "coverage_amount": 100000,
    "premium_amount": 500,
    "currency": "SAR",
    "starts_at": "2026-03-04T17:14:01.697Z",
    "expires_at": "2027-03-04T17:14:01.697Z"
  },
  "updatePayload": {
    "status": "active"
  }
});
