import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Grocery",
  "basePath": "/admin/grocery",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "product_id": "prod-1772649864032",
    "storage_type": "ambient",
    "unit_type": "piece",
    "shelf_life_days": 7
  },
  "updatePayload": {
    "shelf_life_days": 14
  }
});
