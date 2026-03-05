import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Grocery",
  "basePath": "/admin/grocery",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "tenant_id": "test-tenant-1",
    "storage_type": "ambient",
    "shelf_life_days": 7,
    "unit_type": "piece",
    "product_id": "prod-1772671119529"
  },
  "updatePayload": {
    "shelf_life_days": 14
  }
});
