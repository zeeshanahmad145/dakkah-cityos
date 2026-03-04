import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Warranties",
  "basePath": "/admin/warranties",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "name": "Test Warranty",
    "plan_type": "standard",
    "duration_months": 12,
    "currency_code": "SAR",
    "coverage": {
      "parts": true,
      "labor": true
    }
  },
  "updatePayload": {
    "name": "Updated Warranty",
    "duration_months": 24
  }
});
