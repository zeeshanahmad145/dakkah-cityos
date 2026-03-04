import { generateCrudTests } from "./utils/crud-test-generator";

generateCrudTests({
  "moduleName": "Grocery",
  "basePath": "/admin/grocery",
  "entityKey": "item",
  "listKey": "items",
  "createPayload": {
    "storage_type": "ambient",
    "unit_type": "piece",
    "shelf_life_days": 7,
    "name": "Grocery 1772652757882",
    "price": 10,
    "currency_code": "SAR",
    "tenant_id": "test-tenant-1"
  },
  "updatePayload": {
    "shelf_life_days": 14
  }
});
