import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Warranty",
  "basePath": "/admin/warranty",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "name": "Test Warranty Plan",
    "plan_type": "standard",
    "duration_months": 12,
    "currency_code": "SAR",
    "coverage": {
      "parts": true,
      "labor": true
    }
  },
  "updatePayload": {
    "name": "Updated Warranty Plan"
  }
});
