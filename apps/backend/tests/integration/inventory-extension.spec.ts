import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Inventory Extension",
  "basePath": "/admin/inventory-extension",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "variant_id": "var-44441689",
    "quantity": 10,
    "reason": "manual"
  },
  "updatePayload": {
    "quantity": 20
  }
});
