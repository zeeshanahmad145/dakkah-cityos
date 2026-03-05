import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Warranty",
  "basePath": "/admin/warranty",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "name": "Warranty 1772667436466",
    "plan_type": "extended",
    "duration_months": 12,
    "currency_code": "SAR",
    "coverage": "all parts and labor",
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "name": "Updated Warranty"
  }
});
