import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Fitness",
  "basePath": "/admin/fitness",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "customer_id": "c-1772668663845",
    "membership_type": "basic",
    "start_date": "2026-04-01",
    "monthly_fee": 100,
    "currency_code": "SAR"
  },
  "updatePayload": {
    "membership_type": "annual"
  }
});
