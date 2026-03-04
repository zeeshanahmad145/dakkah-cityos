import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Affiliates",
  "basePath": "/admin/affiliates",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "name": "Test Affiliate",
    "email": "aff-45524914@example.com",
    "affiliate_type": "standard",
    "commission_rate": 10
  },
  "updatePayload": {
    "name": "Updated Affiliate"
  }
});
