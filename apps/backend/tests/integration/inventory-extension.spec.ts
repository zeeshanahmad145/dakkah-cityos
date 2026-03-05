import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Inventory Extension",
  "basePath": "/admin/inventory-extension",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "variant_id": "var-1772667436466",
    "quantity": 10,
    "tenant_id": "test-tenant-1",
    "reason": "reservation"
  },
  "updatePayload": {
    "quantity": 20
  }
});
