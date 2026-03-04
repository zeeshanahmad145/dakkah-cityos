import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Memberships",
  "basePath": "/admin/memberships",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "customer_id": "test-customer-1",
    "tier_id": "test-tier-1",
    "membership_number": "MEM-44441689",
    "joined_at": "2026-03-04T17:14:01.697Z"
  },
  "updatePayload": {
    "status": "cancelled"
  }
});
